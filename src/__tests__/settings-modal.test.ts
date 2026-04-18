import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const SETTINGS_MODAL_SOURCE = resolve(__dirname, '..', 'components', 'SettingsModal.tsx');

describe('SettingsModal UI polish guardrails', () => {
  const source = readFileSync(SETTINGS_MODAL_SOURCE, 'utf-8');

  it('must not hardcode modal background colors inline', () => {
    expect(source).not.toContain("background: '#30302e'");
  });

  it('must not keep appearance tab layout driven by inline flex gap style', () => {
    expect(source).not.toContain("style={{ display: 'flex', gap: '8px' }}");
  });

  it('must not keep backup action row driven by inline spacing style', () => {
    expect(source).not.toContain("style={{ display: 'flex', gap: '8px', marginTop: '12px' }}");
  });

  it('must not keep settings feedback spacing driven by inline margin style', () => {
    expect(source).not.toContain("style={{ marginTop: '12px' }}");
  });

  it('must keep settings tab semantics and active state class', () => {
    expect(source).toContain('role="tablist"');
    expect(source).toContain('role="tab"');
    expect(source).toContain('settings-tab--active');
  });

  it('must keep settings content mounted inside modal body settings container', () => {
    expect(source).toContain('modal__body modal__body--settings');
    expect(source).toContain('settings-content');
  });
});
