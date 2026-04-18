import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const SETTINGS_MODAL_SOURCE = resolve(__dirname, '..', 'components', 'SettingsModal.tsx');

describe('SettingsModal UI polish guardrails', () => {
  const source = readFileSync(SETTINGS_MODAL_SOURCE, 'utf-8');

  const componentMatch = source.match(/export const SettingsModal: React\.FC<SettingsModalProps> = \(\{ onClose \}\) => \{([\s\S]*?)\n\};/);
  expect(componentMatch).not.toBeNull();

  const componentBody = componentMatch![1];

  const jsxMatch = componentBody.match(/return \(([\s\S]*?)\n\s*\);/);
  expect(jsxMatch).not.toBeNull();

  const jsx = jsxMatch![1];

  it('must not hardcode modal background colors inline', () => {
    expect(/background\s*:\s*['\"]#30302e['\"]/.test(jsx)).toBe(false);
  });

  it('must not keep appearance tab layout driven by inline flex gap style', () => {
    expect(/style=\{\{\s*display\s*:\s*['\"]flex['\"],\s*gap\s*:\s*['\"]8px['\"]\s*\}\}/.test(jsx)).toBe(false);
  });

  it('must not keep backup action row driven by inline spacing style', () => {
    expect(/style=\{\{\s*display\s*:\s*['\"]flex['\"],\s*gap\s*:\s*['\"]8px['\"],\s*marginTop\s*:\s*['\"]12px['\"]\s*\}\}/.test(jsx)).toBe(false);
  });

  it('must not keep settings feedback spacing driven by inline margin style', () => {
    expect(/style=\{\{\s*marginTop\s*:\s*['\"]12px['\"]\s*\}\}/.test(jsx)).toBe(false);
  });

  it('must keep settings tab semantics and active state class', () => {
    expect(jsx).toContain('role="tablist"');
    expect(jsx).toContain('role="tab"');
    expect(jsx).toContain('settings-tab--active');
  });

  it('must keep settings content mounted inside modal body settings container', () => {
    expect(jsx).toContain('modal__body modal__body--settings');
    expect(jsx).toContain('settings-content');
  });
});
