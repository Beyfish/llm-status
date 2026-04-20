// @vitest-environment jsdom

import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { cleanup, fireEvent, render, waitFor } from '@testing-library/react';
import React from 'react';

const mockStoreState = {
  settings: {
    language: 'en-US',
    storageMode: 'encrypted',
    defaultLatencyMode: 'full',
    autoCheckInterval: 0,
    screenRecordingProtection: false,
  },
  updateSettings: vi.fn(),
  theme: 'dark',
  setTheme: vi.fn(),
  providers: [],
};

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: {
      language: 'en-US',
      changeLanguage: vi.fn(),
    },
  }),
}));

vi.mock('../store', () => ({
  useStore: Object.assign(() => mockStoreState, {
    getState: () => ({
      ...mockStoreState,
      addProvider: vi.fn(),
    }),
  }),
}));

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const GLOBAL_STYLES = resolve(__dirname, '..', 'styles', 'global.css');
const APP_SOURCE = resolve(__dirname, '..', 'App.tsx');
const SETTINGS_MODAL_SOURCE = resolve(__dirname, '..', 'components', 'SettingsModal.tsx');

async function renderSettingsModal() {
  const { SettingsModal } = await import('../components/SettingsModal');
  return render(React.createElement(SettingsModal, { onClose: vi.fn() }));
}

describe('SettingsModal UI polish guardrails', () => {
  beforeEach(() => {
    (window as any).electronAPI = {
      isMac: false,
      configRead: vi.fn().mockResolvedValue({ settings: { configPath: 'C:\\Users\\tester\\AppData\\Roaming\\llm-status\\config.json' } }),
      setScreenProtection: vi.fn(),
      auditFetch: vi.fn().mockResolvedValue({ entries: [] }),
      auditClear: vi.fn().mockResolvedValue(undefined),
      credentialFileExport: vi.fn().mockResolvedValue({ success: true, message: 'Exported' }),
      credentialFileImport: vi.fn().mockResolvedValue({ success: false, message: 'Import failed' }),
    };
  });

  afterEach(() => {
    cleanup();
    delete (window as any).electronAPI;
  });

  it('must not hardcode modal background colors inline', async () => {
    const { container } = await renderSettingsModal();
    const styleNodes = Array.from(container.querySelectorAll('[style]'));

    expect(styleNodes.some((node) => /background/i.test(node.getAttribute('style') ?? ''))).toBe(false);
  });

  it('must not keep advanced backup labels and placeholders hardcoded in English', () => {
    const source = readFileSync(SETTINGS_MODAL_SOURCE, 'utf-8');

    expect(source).not.toContain('Credential Backup & Restore');
    expect(source).not.toContain('Passphrase (min 8 characters)');
    expect(source).not.toContain('Enter a strong passphrase');
    expect(source).not.toContain('Credential export is unavailable in this build');
    expect(source).not.toContain('Credential import is unavailable in this build');
  });

  it('must not keep appearance tab layout driven by inline flex gap style', async () => {
    const { container, getByRole } = await renderSettingsModal();
    fireEvent.click(getByRole('tab', { name: 'settings.appearance' }));

    const themeRow = container.querySelector('.settings-theme-row');

    expect(themeRow).not.toBeNull();
    expect((themeRow?.getAttribute('style') ?? '')).not.toMatch(/\bgap\b/i);
    expect((themeRow?.getAttribute('style') ?? '')).not.toMatch(/\bdisplay\b/i);
  });

  it('must not keep backup action row driven by inline spacing style', async () => {
    const { container, getByRole } = await renderSettingsModal();
    fireEvent.click(getByRole('tab', { name: 'settings.advanced' }));

    const actionRow = container.querySelector('.settings-action-row');

    expect(actionRow).not.toBeNull();
    expect((actionRow?.getAttribute('style') ?? '')).not.toMatch(/\bgap\b/i);
    expect((actionRow?.getAttribute('style') ?? '')).not.toMatch(/\bmargin-top\b/i);
  });

  it('must not keep settings feedback spacing driven by inline margin style', async () => {
    const { container, getByRole } = await renderSettingsModal();
    fireEvent.click(getByRole('tab', { name: 'settings.advanced' }));

    const passwordInput = container.querySelector('input[type="password"]') as HTMLInputElement;
    const exportButton = getByRole('button', { name: 'credentialBackup.export' }) as HTMLButtonElement;

    expect(passwordInput).not.toBeNull();
    expect(exportButton).not.toBeUndefined();

    fireEvent.change(passwordInput, { target: { value: 'passphrase123' } });
    fireEvent.click(exportButton!);

    await waitFor(() => {
      expect(container.querySelector('.settings-feedback')).not.toBeNull();
    });

    const feedback = container.querySelector('.settings-feedback');
    expect((feedback?.getAttribute('style') ?? '')).not.toMatch(/\bmargin-top\b/i);
  });

  it('must fall back to localized export/import failure copy when the bridge returns an empty message', async () => {
    (window as any).electronAPI.credentialFileExport = vi.fn().mockResolvedValue({ success: false, message: '' });
    (window as any).electronAPI.credentialFileImport = vi.fn().mockResolvedValue({ success: false, message: '' });

    const { container, getByRole } = await renderSettingsModal();
    fireEvent.click(getByRole('tab', { name: 'settings.advanced' }));

    const passwordInput = container.querySelector('input[type="password"]') as HTMLInputElement;
    fireEvent.change(passwordInput, { target: { value: 'passphrase123' } });

    fireEvent.click(getByRole('button', { name: 'credentialBackup.export' }));
    await waitFor(() => {
      expect(container.textContent).toContain('credentialBackup.exportFailed');
    });

    fireEvent.click(getByRole('button', { name: 'credentialBackup.import' }));
    await waitFor(() => {
      expect(container.textContent).toContain('credentialBackup.importFailed');
    });
  });

  it('must render the real config path from the bridge in advanced settings', async () => {
    const { getByRole, getByText } = await renderSettingsModal();
    fireEvent.click(getByRole('tab', { name: 'settings.advanced' }));

    await waitFor(() => {
      expect(getByText('C:\\Users\\tester\\AppData\\Roaming\\llm-status\\config.json')).not.toBeNull();
    });
    expect(readFileSync(SETTINGS_MODAL_SOURCE, 'utf-8')).not.toContain('~/.llm-status/config.json');
  });

  it('must not crash advanced tab when configRead is unavailable', async () => {
    delete (window as any).electronAPI.configRead;

    const { getByRole, getByText } = await renderSettingsModal();
    fireEvent.click(getByRole('tab', { name: 'settings.advanced' }));

    expect(getByText('settings.configPathUnavailable')).not.toBeNull();
  });

  it('must keep settings tab semantics and active state class', async () => {
    const { container } = await renderSettingsModal();

    expect(container.querySelector('[role="tablist"]')).not.toBeNull();
    expect(container.querySelectorAll('[role="tab"]')).toHaveLength(5);
    expect(container.querySelector('.settings-tab--active')).not.toBeNull();
  });

  it('must not keep key settings text at undersized 12px/13px defaults for primary reading surfaces', () => {
    const globalCss = readFileSync(GLOBAL_STYLES, 'utf-8');

    const getRule = (selector: string) => {
      const match = globalCss.match(new RegExp(`${selector}\\s*\\{[\\s\\S]*?\\}`));

      expect(match, `missing CSS rule for ${selector}`).not.toBeNull();

      return match![0];
    };

    expect(getRule('.settings-tab')).not.toContain('font-size: 13px;');
    expect(getRule('.settings-field label')).not.toContain('font-size: 13px;');
    expect(getRule('.settings-select')).not.toContain('font-size: 13px;');
    expect(getRule('.settings-helper-text')).not.toContain('font-size: 12px;');
    expect(getRule('.app-header__btn')).not.toContain('font-size: 12px;');
    expect(getRule('.app-sidebar__item')).not.toContain('font-size: 13px;');
  });

  it('must not keep environment filter buttons laid out by inline sidebar styles', () => {
    const appSource = readFileSync(APP_SOURCE, 'utf-8');

    expect(appSource).not.toContain("style={{ display: 'flex', gap: '4px', marginBottom: '8px', flexWrap: 'wrap' }}");
    expect(appSource).not.toContain("style={{ fontSize: '10px', padding: '2px 6px', height: '22px' }}");
  });

  it('must keep settings content mounted inside modal body settings container', async () => {
    const { container } = await renderSettingsModal();

    expect(container.querySelector('.modal__body.modal__body--settings')).not.toBeNull();
    expect(container.querySelector('.settings-content')).not.toBeNull();
  });

  it('must not keep the empty settings-modal shell class on the modal root', async () => {
    const { container: modalContainer } = await renderSettingsModal();

    const modalRoot = modalContainer.querySelector('.modal.modal--large');
    expect(modalRoot).not.toBeNull();

    const classList = (modalRoot as HTMLElement).classList;
    expect(classList.contains('modal')).toBe(true);
    expect(classList.contains('modal--large')).toBe(true);
    expect(classList.contains('settings-modal')).toBe(false);
  });

  it('must consume settings tab width from token instead of hardcoded width', () => {
    const globalCss = readFileSync(GLOBAL_STYLES, 'utf-8');
    const settingsTabsRule = globalCss.match(/\.settings-tabs\s*\{[\s\S]*?\}/);

    expect(settingsTabsRule).not.toBeNull();
    expect(settingsTabsRule![0]).toContain('width: var(--settings-tab-width);');
    expect(settingsTabsRule![0]).not.toContain('width: 180px;');
  });

  it('must not use absolute-position translateX animation on centered modal entry', () => {
    const globalCss = readFileSync(GLOBAL_STYLES, 'utf-8');
    const slideUpStart = globalCss.indexOf('@keyframes slideUp');

    expect(slideUpStart).toBeGreaterThanOrEqual(0);

    const slideUpBlock = globalCss.slice(slideUpStart, globalCss.indexOf('.modal {', slideUpStart));

    expect(slideUpBlock).toContain('translateY(10px)');
    expect(slideUpBlock).toContain('translateY(0)');
    expect(slideUpBlock).not.toMatch(/translate\(-50%,\s*10px\)/);
    expect(slideUpBlock).not.toMatch(/translate\(-50%,\s*0\)/);
  });

  it('must keep advanced tab renderable when the desktop bridge is missing', async () => {
    delete (window as any).electronAPI;

    const { getByRole, getByText } = await renderSettingsModal();
    fireEvent.click(getByRole('tab', { name: 'settings.advanced' }));

    expect(getByText('credentialBackup.title')).not.toBeNull();
  });
});
