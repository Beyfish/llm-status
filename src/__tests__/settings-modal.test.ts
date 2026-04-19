// @vitest-environment jsdom

import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { cleanup, render } from '@testing-library/react';
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

const SETTINGS_MODAL_SOURCE = resolve(__dirname, '..', 'components', 'SettingsModal.tsx');
const GLOBAL_STYLES = resolve(__dirname, '..', 'styles', 'global.css');

describe('SettingsModal UI polish guardrails', () => {
  beforeEach(() => {
    (window as any).electronAPI = {
      isMac: false,
      setScreenProtection: vi.fn(),
    };
  });

  afterEach(() => {
    cleanup();
    delete (window as any).electronAPI;
  });

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

  it('must not keep the empty settings-modal shell class on the modal root', async () => {
    const { SettingsModal } = await import('../components/SettingsModal');
    const { container: modalContainer } = render(React.createElement(SettingsModal, { onClose: vi.fn() }));

    const modalRoot = modalContainer.querySelector('.modal');
    expect(modalRoot).not.toBeNull();

    const classList = (modalRoot as HTMLElement).classList;
    expect(classList.contains('modal')).toBe(true);
    expect(classList.contains('modal--large')).toBe(true);
    expect(classList.contains('settings-modal')).toBe(false);
  });

  it('must consume settings tab width from token instead of hardcoded width', () => {
    const globalCss = readFileSync(GLOBAL_STYLES, 'utf-8');
    expect(globalCss).toMatch(/\.settings-tabs\s*\{[^}]*width:\s*var\(--settings-tab-width\)\s*;[^}]*\}/s);
    expect(globalCss).not.toMatch(/\.settings-tabs\s*\{[^}]*width:\s*180px\s*;[^}]*\}/s);
  });
});
