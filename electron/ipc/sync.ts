import { ipcMain, dialog } from 'electron';
import { createClient, FileStat } from 'webdav';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { Readable } from 'stream';

const REMOTE_PATH = 'llm-status/config.json';

interface SyncRequest {
  protocol: string;
  config: Record<string, string>;
}

// WebDAV
async function webdavUpload(config: Record<string, string>, data: string): Promise<void> {
  const client = createClient(config.url, {
    username: config.username,
    password: config.password,
  });
  await client.putFileContents(REMOTE_PATH, data, { overwrite: true });
}

async function webdavDownload(config: Record<string, string>): Promise<string> {
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
  return body.toString('utf-8');
}

// Google Drive (placeholder - requires OAuth setup)
async function gdriveUpload(_config: Record<string, string>, _data: string): Promise<void> {
  throw new Error('Google Drive sync requires OAuth setup');
}

async function gdriveDownload(_config: Record<string, string>): Promise<string> {
  throw new Error('Google Drive sync requires OAuth setup');
}

// OneDrive (placeholder - requires OAuth setup)
async function onedriveUpload(_config: Record<string, string>, _data: string): Promise<void> {
  throw new Error('OneDrive sync requires OAuth setup');
}

async function onedriveDownload(_config: Record<string, string>): Promise<string> {
  throw new Error('OneDrive sync requires OAuth setup');
}

export function registerSyncHandlers(): void {
  ipcMain.handle('sync:upload', async (_event, req: SyncRequest): Promise<{ success: boolean; timestamp: string }> => {
    try {
      const configData = JSON.stringify(req.config);
      switch (req.protocol) {
        case 'webdav':
          await webdavUpload(req.config, configData);
          break;
        case 's3':
          await s3Upload(req.config, configData);
          break;
        case 'gdrive':
          await gdriveUpload(req.config, configData);
          break;
        case 'onedrive':
          await onedriveUpload(req.config, configData);
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
      return { success: true, data: JSON.parse(content), timestamp: new Date().toISOString() };
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
