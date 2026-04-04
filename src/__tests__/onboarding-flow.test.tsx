import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { OnboardingFlow } from '../components/OnboardingFlow';
import '@/i18n'; // Initialize i18next before rendering

/**
 * Regression test for provider selection step advancement.
 *
 * Bug: handleSelectProvider() was calling setStep(1) which kept users
 * on the provider-selection screen (step 1) instead of advancing to
 * the credential-type screen (step 2).
 *
 * This test renders the component, clicks a provider card, and asserts
 * that step 2 (credential type selection) content becomes visible.
 */
describe('OnboardingFlow provider selection', () => {
  it('should advance to step 2 (credential type) after selecting a provider', () => {
    const { container } = render(
      <OnboardingFlow onComplete={() => {}} onSkip={() => {}} />
    );

    // Step 0: welcome screen — click "Get Started" to reach provider selection
    const getStartedBtn = screen.getByRole('button', { name: /get started|开始使用/i });
    fireEvent.click(getStartedBtn);

    // Step 1: provider selection grid should now be visible
    const providerCards = container.querySelectorAll('.onboarding__grid .onboarding__card');
    expect(providerCards.length).toBeGreaterThan(0);

    // Click the first provider card (OpenAI)
    fireEvent.click(providerCards[0]);

    // Step 2: credential type selection should now be visible
    const authCards = container.querySelectorAll('.onboarding__card--horizontal');
    expect(authCards.length).toBeGreaterThan(0);

    // Verify we're no longer on the provider selection grid
    const providerGridCards = container.querySelectorAll('.onboarding__grid .onboarding__card');
    expect(providerGridCards.length).toBe(0);
  });

  it('should prefill provider name and base URL after selecting a provider', () => {
    const { container } = render(
      <OnboardingFlow onComplete={() => {}} onSkip={() => {}} />
    );

    // Navigate past welcome screen
    const getStartedBtn = screen.getByRole('button', { name: /get started|开始使用/i });
    fireEvent.click(getStartedBtn);

    // Click the OpenAI provider card (first in PROVIDER_OPTIONS)
    const providerCards = container.querySelectorAll('.onboarding__grid .onboarding__card');
    fireEvent.click(providerCards[0]);

    // Step 2: click Next to go to step 3 (credentials)
    const nextButton = container.querySelector('.onboarding__nav .btn--primary');
    expect(nextButton).toBeTruthy();
    fireEvent.click(nextButton!);

    // Step 3: should show prefilled provider name and base URL inputs
    const inputs = container.querySelectorAll('.onboarding__input');
    expect(inputs.length).toBeGreaterThanOrEqual(2);

    // First input should be provider name ("OpenAI")
    expect((inputs[0] as HTMLInputElement).value).toBe('OpenAI');
    // Second input should be base URL ("https://api.openai.com")
    expect((inputs[1] as HTMLInputElement).value).toBe('https://api.openai.com');
  });
});
