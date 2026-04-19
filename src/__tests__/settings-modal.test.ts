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
const SETTINGS_MODAL_SOURCE = resolve(__dirname, '..', 'components', 'SettingsModal.tsx');

async function renderSettingsModal() {
  const { SettingsModal } = await import('../components/SettingsModal');
  return render(React.createElement(SettingsModal, { onClose: vi.fn() }));
}

describe('SettingsModal UI polish guardrails', () => {
  beforeEach(() => {
    (window as any).electronAPI = {
      isMac: false,
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

  it('must keep settings tab semantics and active state class', async () => {
    const { container } = await renderSettingsModal();

    expect(container.querySelector('[role="tablist"]')).not.toBeNull();
    expect(container.querySelectorAll('[role="tab"]')).toHaveLength(5);
    expect(container.querySelector('.settings-tab--active')).not.toBeNull();
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
});
