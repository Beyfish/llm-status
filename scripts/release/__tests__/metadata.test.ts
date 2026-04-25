import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

import {
  extractReleaseNotes,
  hasVersionEntry,
  parseVersion,
  validateReleaseInputs,
} from '../metadata';

describe('release metadata', () => {
  it('parses VERSION text into a clean semver string', () => {
    expect(parseVersion('0.2.0.1\n')).toBe('0.2.0.1');
  });

  it('extracts changelog notes for an exact version header', () => {
    const changelog = `# Changelog

## [0.2.0.1] - 2026-04-04

### Fixed
- preload path corrected

## [0.1.0.0] - 2026-04-01

### Added
- initial release`;

    expect(extractReleaseNotes(changelog, '0.2.0.1')).toContain('preload path corrected');
    expect(extractReleaseNotes(changelog, '0.2.0.1')).not.toContain('initial release');
  });

  it('reports whether CHANGELOG has a matching version section', () => {
    const changelog = '## [0.2.0.1] - 2026-04-04';
    expect(hasVersionEntry(changelog, '0.2.0.1')).toBe(true);
    expect(hasVersionEntry(changelog, '9.9.9')).toBe(false);
  });

  it('fails validation when VERSION has no matching changelog entry', () => {
    const result = validateReleaseInputs({
      versionText: '0.2.0.2\n',
      changelogText: '## [0.2.0.1] - 2026-04-04',
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toContain('CHANGELOG');
    }
  });

  it('treats a matching version entry as explicit release intent', () => {
    const result = validateReleaseInputs({
      versionText: '0.2.0.2\n',
      changelogText: '## [0.2.0.2] - 2026-04-06\n\n### Added\n- release automation',
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.version).toBe('0.2.0.2');
    }
  });

  it('extracts only the selected version section without the next release notes', () => {
    const changelog = `## [0.2.0.2] - 2026-04-06

### Added
- first

## [0.2.0.1] - 2026-04-04

### Fixed
- second`;

    const notes = extractReleaseNotes(changelog, '0.2.0.2');
    expect(notes).toContain('first');
    expect(notes).not.toContain('second');
  });
});

describe('VERSION file BOM guard', () => {
  const WORKTREE_ROOT = resolve(__dirname, '../../..');
  const VERSION_PATH = resolve(WORKTREE_ROOT, 'VERSION');

  it('must NOT start with UTF-8 BOM', () => {
    const raw = readFileSync(VERSION_PATH);
    const hasBOM = raw[0] === 0xEF && raw[1] === 0xBB && raw[2] === 0xBF;
    expect(hasBOM).toBe(false);
  });

  it('must match release version format (X.Y.Z or X.Y.Z.W)', () => {
    const content = readFileSync(VERSION_PATH, 'utf-8').trim();
    expect(content).toMatch(/^\d+\.\d+\.\d+(\.\d+)?$/);
  });

  it('must not contain whitespace or newlines', () => {
    const content = readFileSync(VERSION_PATH, 'utf-8');
    expect(content).not.toMatch(/[\s]/);
  });
});
