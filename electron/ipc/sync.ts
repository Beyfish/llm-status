import { ipcMain, dialog, safeStorage } from 'electron';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { Readable } from 'stream';
import { google } from 'googleapis';

// Lazy-load webdav to avoid top-level require('webdav') crash.
// webdav v5.x is ESM-only (type: module); Electron main process is CommonJS.
// Dynamic import defers resolution until the function is actually called.
let _webdavCreateClient: typeof import('webdav').createClient | null = null;
async function getWebdavCreateClient() {
  if (!_webdavCreateClient) {
    const { createClient } = await import('webdav');
    _webdavCreateClient = createClient;
  }
  return _webdavCreateClient;
}

const REMOTE_PATH = 'llm-status/config.json';

function encryptForSync(data: string): string {
  if (!safeStorage.isEncryptionAvailable()) {
    return data; // Fallback: send plaintext (better than crashing)
  }
  const encrypted = safeStorage.encryptString(data);
  return encrypted.toString('base64');
}

function decryptFromSync(encryptedBase64: string): string {
  try {
    if (!safeStorage.isEncryptionAvailable()) {
      return encryptedBase64; // Can't decrypt, return as-is
    }
    const buffer = Buffer.from(encryptedBase64, 'base64');
    return safeStorage.decryptString(buffer);
  } catch {
    // Fallback: treat as plaintext JSON (backward compat with old unencrypted sync data)
    return encryptedBase64;
  }
}

interface SyncRequest {
  protocol: string;
  config: Record<string, string>;
  data?: Record<string, unknown>;
  localVersion?: string;
}

// WebDAV
async function webdavUpload(config: Record<string, string>, data: string): Promise<void> {
  const createClient = await getWebdavCreateClient();
  const client = createClient(config.url, {
    username: config.username,
    password: config.password,
  });
  await client.putFileContents(REMOTE_PATH, data, { overwrite: true });
}

async function webdavDownload(config: Record<string, string>): Promise<string> {
  const createClient = await getWebdavCreateClient();
  const client = createClient(config.url, {
    username: config.username,
    password: config.password,
  });
  const exists = await client.exists(REMOTE_PATH);
  if (!exists) throw new Error('Remote config not found');
  const content = await client.getFileContents(REMOTE_PATH, { format: 'text' });
  return content as string;
}

// S3
async function s3Upload(config: Record<string, string>, data: string): Promise<void> {
  const client = new S3Client({
    endpoint: config.endpoint || undefined,
    region: config.region || 'us-east-1',
    credentials: {
      accessKeyId: config.accessKey || '',
      secretAccessKey: config.secretKey || '',
    },
    forcePathStyle: true,
  });
  await client.send(new PutObjectCommand({
    Bucket: config.bucket,
    Key: REMOTE_PATH,
    Body: data,
    ContentType: 'application/json',
  }));
}

async function s3Download(config: Record<string, string>): Promise<string> {
  const client = new S3Client({
    endpoint: config.endpoint || undefined,
    region: config.region || 'us-east-1',
    credentials: {
      accessKeyId: config.accessKey || '',
      secretAccessKey: config.secretKey || '',
    },
    forcePathStyle: true,
  });
  const response = await client.send(new GetObjectCommand({
    Bucket: config.bucket,
    Key: REMOTE_PATH,
  }));
  const body = response.Body as Readable;
  const chunks: Buffer[] = [];
  for await (const chunk of body) {
    chunks.push(Buffer.from(chunk));
  }
  return Buffer.concat(chunks).toString('utf-8');
}

// Google Drive
async function gdriveUpload(config: Record<string, string>, data: string): Promise<void> {
  const oauth2Client = new google.auth.OAuth2(
    config.clientId,
    config.clientSecret,
    config.redirectUri || 'http://localhost:17171/oauth/callback',
  );
  oauth2Client.setCredentials({
    access_token: config.accessToken,
    refresh_token: config.refreshToken,
  });

  const drive = google.drive({ version: 'v3', auth: oauth2Client });

  // Find or create app folder
  const folderRes = await drive.files.list({
    q: "name='llm-status' and mimeType='application/vnd.google-apps.folder' and trashed=false",
    fields: 'files(id)',
  });

  let folderId: string;
  if (folderRes.data.files && folderRes.data.files.length > 0) {
    folderId = folderRes.data.files[0].id!;
  } else {
    const folder = await drive.files.create({
      requestBody: { name: 'llm-status', mimeType: 'application/vnd.google-apps.folder' },
      fields: 'id',
    });
    folderId = folder.data.id!;
  }

  // Find or create config file
  const fileRes = await drive.files.list({
    q: `name='config.json' and '${folderId}' in parents and trashed=false`,
    fields: 'files(id)',
  });

  if (fileRes.data.files && fileRes.data.files.length > 0) {
    await drive.files.update({
      fileId: fileRes.data.files[0].id!,
      media: { mimeType: 'application/json', body: data },
    });
  } else {
    await drive.files.create({
      requestBody: { name: 'config.json', parents: [folderId] },
      media: { mimeType: 'application/json', body: data },
    });
  }
}

async function gdriveDownload(config: Record<string, string>): Promise<string> {
  const oauth2Client = new google.auth.OAuth2(
    config.clientId,
    config.clientSecret,
    config.redirectUri || 'http://localhost:17171/oauth/callback',
  );
  oauth2Client.setCredentials({
    access_token: config.accessToken,
    refresh_token: config.refreshToken,
  });

  const drive = google.drive({ version: 'v3', auth: oauth2Client });
  const fileRes = await drive.files.list({
    q: "name='config.json' and mimeType='application/json' and trashed=false",
    fields: 'files(id)',
    orderBy: 'modifiedTime desc',
    pageSize: 1,
  });

  if (!fileRes.data.files || fileRes.data.files.length === 0) {
    throw new Error('Remote config not found');
  }

  const response = await drive.files.get(
    { fileId: fileRes.data.files[0].id!, alt: 'media' },
    { responseType: 'text' },
  );
  return response.data as string;
}

// OneDrive
async function onedriveUpload(config: Record<string, string>, data: string): Promise<void> {
  const accessToken = config.accessToken;
  const filePath = '/Apps/llm-status/config.json';

  const response = await fetch(`https://graph.microsoft.com/v1.0/me/drive/root:${encodeURIComponent(filePath)}:/content`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: data,
  });

  if (!response.ok) {
    throw new Error(`OneDrive upload failed: ${response.status} ${response.statusText}`);
  }
}

async function onedriveDownload(config: Record<string, string>): Promise<string> {
  const accessToken = config.accessToken;
  const filePath = '/Apps/llm-status/config.json';

  const response = await fetch(`https://graph.microsoft.com/v1.0/me/drive/root:${encodeURIComponent(filePath)}:/content`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) throw new Error('Remote config not found');
  return response.text();
}

export function registerSyncHandlers(): void {
  ipcMain.handle('sync:checkConflict', async (_event, req: SyncRequest): Promise<SyncConflictInfo> => {
    try {
      let content: string;
      switch (req.protocol) {
        case 'webdav':
          content = await webdavDownload(req.config);
          break;
        case 's3':
          content = await s3Download(req.config);
          break;
        case 'gdrive':
          content = await gdriveDownload(req.config);
          break;
        case 'onedrive':
          content = await onedriveDownload(req.config);
          break;
        default:
          return { hasConflict: false };
      }

      let remoteData: any;
      try {
        const decrypted = decryptFromSync(content);
        remoteData = JSON.parse(decrypted);
      } catch {
        remoteData = JSON.parse(content);
      }

      const localVersion = req.localVersion || req.config.schemaVersion;
      const remoteVersion = remoteData.schemaVersion;
      const localModifiedAt = req.config.lastModifiedAt;
      const remoteModifiedAt = remoteData.lastModifiedAt;

      const hasConflict = localVersion !== remoteVersion ||
        (localModifiedAt && remoteModifiedAt && localModifiedAt !== remoteModifiedAt);

      return {
        hasConflict,
        localVersion: localVersion?.toString(),
        remoteVersion: remoteVersion?.toString(),
        localModifiedAt,
        remoteModifiedAt,
        localData: JSON.stringify(req.config),
        remoteData: content,
      };
    } catch {
      return { hasConflict: false };
    }
  });

  ipcMain.handle('sync:upload', async (_event, req: SyncRequest): Promise<{ success: boolean; timestamp: string; conflict?: SyncConflictInfo }> => {
    try {
      // Check for conflicts before uploading
      const localVersion = req.config.schemaVersion || 1;
      const localModifiedAt = new Date().toISOString();
      const configWithVersion = { ...req.config, schemaVersion: localVersion, lastModifiedAt: localModifiedAt };
      const configData = JSON.stringify(configWithVersion);
      const encryptedData = encryptForSync(configData);

      // Check for conflicts first
      try {
        let remoteContent: string;
        switch (req.protocol) {
          case 'webdav':
            remoteContent = await webdavDownload(req.config);
            break;
          case 's3':
            remoteContent = await s3Download(req.config);
            break;
          case 'gdrive':
            remoteContent = await gdriveDownload(req.config);
            break;
          case 'onedrive':
            remoteContent = await onedriveDownload(req.config);
            break;
          default:
            remoteContent = '';
        }

        if (remoteContent) {
          let remoteData: any;
          try {
            const decrypted = decryptFromSync(remoteContent);
            remoteData = JSON.parse(decrypted);
          } catch {
            remoteData = JSON.parse(remoteContent);
          }

          const remoteVersion = remoteData.schemaVersion;
          const remoteModifiedAt = remoteData.lastModifiedAt;

          if (remoteVersion !== localVersion || (remoteModifiedAt && remoteModifiedAt !== localModifiedAt)) {
            return {
              success: false,
              timestamp: new Date().toISOString(),
              conflict: {
                hasConflict: true,
                localVersion: localVersion?.toString(),
                remoteVersion: remoteVersion?.toString(),
                localModifiedAt: localModifiedAt,
                remoteModifiedAt,
              },
            };
          }
        }
      } catch {
        // Remote doesn't exist yet, no conflict
      }

      switch (req.protocol) {
        case 'webdav':
          await webdavUpload(req.config, encryptedData);
          break;
        case 's3':
          await s3Upload(req.config, encryptedData);
          break;
        case 'gdrive':
          await gdriveUpload(req.config, encryptedData);
          break;
        case 'onedrive':
          await onedriveUpload(req.config, encryptedData);
          break;
        default:
          throw new Error(`Unknown protocol: ${req.protocol}`);
      }
      return { success: true, timestamp: new Date().toISOString() };
    } catch (err: any) {
      _event.sender.send('sync:error', { protocol: req.protocol, error: err.code || 'UNKNOWN', message: err.message });
      throw err;
    }
  });

  ipcMain.handle('sync:download', async (_event, req: SyncRequest): Promise<{ success: boolean; data?: any; timestamp: string }> => {
    try {
      let content: string;
      switch (req.protocol) {
        case 'webdav':
          content = await webdavDownload(req.config);
          break;
        case 's3':
          content = await s3Download(req.config);
          break;
        case 'gdrive':
          content = await gdriveDownload(req.config);
          break;
        case 'onedrive':
          content = await onedriveDownload(req.config);
          break;
        default:
          throw new Error(`Unknown protocol: ${req.protocol}`);
      }

      // Try to decrypt; if fails, assume plaintext (backward compat)
      let parsedData: any;
      try {
        const decrypted = decryptFromSync(content);
        parsedData = JSON.parse(decrypted);
      } catch {
        // Fallback: treat as plaintext JSON
        parsedData = JSON.parse(content);
      }

      return { success: true, data: parsedData, timestamp: new Date().toISOString() };
    } catch (err: any) {
      _event.sender.send('sync:error', { protocol: req.protocol, error: err.code || 'UNKNOWN', message: err.message });
      throw err;
    }
  });

  // Test connection
  ipcMain.handle('sync:test', async (_event, req: SyncRequest): Promise<{ success: boolean; message: string }> => {
    try {
      switch (req.protocol) {
        case 'webdav': {
          const createClient = await getWebdavCreateClient();
          const client = createClient(req.config.url, {
            username: req.config.username,
            password: req.config.password,
          });
          await client.getDirectoryContents('/');
          return { success: true, message: 'WebDAV connection successful' };
        }
        case 's3': {
          const s3Client = new S3Client({
            endpoint: req.config.endpoint || undefined,
            region: req.config.region || 'us-east-1',
            credentials: {
              accessKeyId: req.config.accessKey || '',
              secretAccessKey: req.config.secretKey || '',
            },
            forcePathStyle: true,
          });
          await s3Client.send(new GetObjectCommand({ Bucket: req.config.bucket, Key: 'test' }));
          return { success: true, message: 'S3 connection successful' };
        }
        default:
          return { success: false, message: `Protocol ${req.protocol} not yet supported for testing` };
      }
    } catch (err: any) {
      return { success: false, message: err.message || 'Connection failed' };
    }
  });
}
