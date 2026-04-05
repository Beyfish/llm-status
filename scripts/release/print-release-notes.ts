import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { extractReleaseNotes, validateReleaseInputs } from './metadata';

const root = process.cwd();
const versionText = readFileSync(resolve(root, 'VERSION'), 'utf8');
const changelogText = readFileSync(resolve(root, 'CHANGELOG.md'), 'utf8');
const result = validateReleaseInputs({ versionText, changelogText });
const explicitVersion = process.env.GITHUB_REF_NAME?.replace(/^v/, '') || process.argv[2];

if (!result.ok) {
  console.error(result.reason);
  process.exit(1);
}

if (process.argv.includes('--validate')) {
  console.log(`release metadata valid for ${result.version}`);
  process.exit(0);
}

console.log(extractReleaseNotes(changelogText, explicitVersion || result.version));
