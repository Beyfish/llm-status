import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PROVIDER_DETAIL_SOURCE = resolve(__dirname, '..', 'components', 'ProviderDetail.tsx');
const source = readFileSync(PROVIDER_DETAIL_SOURCE, 'utf-8');

describe('Clipboard auto-clear integration', () => {
  it('uses electronAPI.clipboardWriteAndClear instead of navigator.clipboard', () => {
    expect(source).toContain('window.electronAPI.clipboardWriteAndClear(curl, delayMs)');
    expect(source).not.toContain('navigator.clipboard.writeText');
  });

  it('uses 30 second auto-clear delay for copied curl commands', () => {
    expect(source).toContain('const delayMs = 30000');
  });

  it('does not trigger copy when credential or value is missing', () => {
    expect(source).toContain('if (!cred || !cred.value) return;');
  });

  it('only shows copied state when clipboard write succeeds', () => {
    expect(source).toContain('if (result.success)');
    expect(source).toContain('setCopiedCredId(credId)');
  });

  it('resets copied UI state after 2 seconds', () => {
    expect(source).toContain('setTimeout(() => setCopiedCredId(null), 2000)');
  });
});
