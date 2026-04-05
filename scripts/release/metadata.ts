export function parseVersion(versionText: string): string {
  return versionText.trim();
}

export function hasVersionEntry(changelogText: string, version: string): boolean {
  const escaped = version.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(`^## \\[${escaped}\\]\\s+-\\s+`, 'm');
  return re.test(changelogText);
}

export function extractReleaseNotes(changelogText: string, version: string): string {
  const escaped = version.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const headerRe = new RegExp(`^## \\[${escaped}\\]\\s+-\\s+.*$`, 'm');
  const headerMatch = changelogText.match(headerRe);

  if (!headerMatch || headerMatch.index === undefined) {
    throw new Error(`CHANGELOG.md does not contain version ${version}`);
  }

  const start = headerMatch.index + headerMatch[0].length;
  const rest = changelogText.slice(start).replace(/^\r?\n/, '');
  const nextHeaderIndex = rest.search(/^## \[/m);

  if (nextHeaderIndex === -1) {
    return rest.trim();
  }

  return rest.slice(0, nextHeaderIndex).trim();
}

type ValidationResult =
  | { ok: true; version: string }
  | { ok: false; reason: string };

export function validateReleaseInputs(input: { versionText: string; changelogText: string }): ValidationResult {
  const version = parseVersion(input.versionText);

  if (!version) {
    return { ok: false, reason: 'VERSION file is empty' };
  }

  if (!hasVersionEntry(input.changelogText, version)) {
    return { ok: false, reason: `CHANGELOG.md is missing entry for ${version}` };
  }

  return { ok: true, version };
}
