import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join, resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Regression test for provider selection step advancement.
 *
 * Bug: handleSelectProvider() was calling setStep(1) which kept users
 * on the provider-selection screen (step 1) instead of advancing to
 * the credential-type screen (step 2).
 *
 * Fix: setStep(1) changed to setStep(2) in handleSelectProvider().
 * This test asserts the source code contains the correct step value.
 */
const ONBOARDING_SOURCE = resolve(__dirname, '..', 'components', 'OnboardingFlow.tsx');

describe('OnboardingFlow provider selection', () => {
  const source = readFileSync(ONBOARDING_SOURCE, 'utf-8');

  it('must NOT call setStep(1) inside handleSelectProvider', () => {
    // Extract the handleSelectProvider arrow function body
    const fnMatch = source.match(/const\s+handleSelectProvider\s*=\s*\([^)]*\)\s*=>\s*\{([\s\S]*?)\n\s*\};/);
    expect(fnMatch).not.toBeNull();

    const fnBody = fnMatch![1];

    // The buggy version had setStep(1) which kept users on the same screen
    const hasBuggySetStep = /setStep\s*\(\s*1\s*\)/.test(fnBody);
    expect(hasBuggySetStep).toBe(false);
  });

  it('must call setStep(2) to advance to credential type screen', () => {
    const fnMatch = source.match(/const\s+handleSelectProvider\s*=\s*\([^)]*\)\s*=>\s*\{([\s\S]*?)\n\s*\};/);
    expect(fnMatch).not.toBeNull();

    const fnBody = fnMatch![1];

    // The fix: after selecting a provider, advance to step 2 (credential type)
    const hasFixedSetStep = /setStep\s*\(\s*2\s*\)/.test(fnBody);
    expect(hasFixedSetStep).toBe(true);
  });

  it('must still prefill providerName and baseUrl after selection', () => {
    const fnMatch = source.match(/const\s+handleSelectProvider\s*=\s*\([^)]*\)\s*=>\s*\{([\s\S]*?)\n\s*\};/);
    expect(fnMatch).not.toBeNull();

    const fnBody = fnMatch![1];

    // The fix must not remove the prefill behavior
    expect(fnBody).toContain('setProviderName');
    expect(fnBody).toContain('setBaseUrl');
  });
});
