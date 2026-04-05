# Contributing

Thank you for your interest in LLM Status Manager! This guide will help you get started.

## Quick Start

```bash
# Fork and clone
git clone https://github.com/YOUR_USERNAME/llm-status.git
cd llm-status

# Install dependencies
npm install
# or: bun install

# Start development server
npm run dev

# Run tests
npm test

# Build
npm run build:win    # Windows
npm run build:mac    # macOS
npm run build:linux  # Linux
```

## Development Workflow

### 1. Create a Feature Branch

```bash
git checkout -b feat/your-feature-name
```

### 2. Make Your Changes

- Follow the existing code style (Prettier + ESLint)
- Add tests for new functionality
- Update documentation if behavior changes

### 3. Run the Full Check Suite

```bash
# Type check
npm run typecheck

# Tests
npm test

# Build (optional, to verify packaging)
npm run build:win
```

### 4. Commit

We use conventional commits:

```
feat: add new provider type
fix: resolve sync conflict detection bug
docs: update README with new screenshots
test: add encryption edge case tests
chore: update electron-builder config
```

### 5. Push and Create a PR

```bash
git push origin feat/your-feature-name
```

Then open a pull request on GitHub.

## Project Structure

```
llm-status/
├── electron/           # Main process code
│   ├── main.ts         # Entry point
│   ├── preload.ts      # IPC bridge
│   └── ipc/            # IPC handler modules (13 files)
├── src/                # Renderer code
│   ├── components/     # React components (17 files)
│   ├── store/          # Zustand state management
│   ├── styles/         # CSS tokens + global styles
│   ├── types/          # TypeScript definitions
│   ├── utils/          # Utility functions
│   ├── i18n/           # Internationalization
│   └── __tests__/      # Test suite
├── public/             # Static assets
├── DESIGN.md           # Design system documentation
├── ARCHITECTURE.md     # System architecture
├── SECURITY.md         # Security model
└── TODOS.md            # Work tracking
```

## Adding a New Provider

Providers are defined by their configuration in the codebase. To add support for a new provider:

1. **Add the provider type** to `src/types/index.ts`:
   ```typescript
   export type ProviderType = 'openai' | 'anthropic' | ... | 'your-provider';
   ```

2. **Add latency detection logic** to `electron/ipc/latency.ts`:
   - Define the health check endpoint
   - Define the authentication header format
   - Handle provider-specific error responses

3. **Add provider logo** to `src/components/ProviderLogo.tsx`:
   - Add a simple text/icon fallback if no logo is available

4. **Add i18n keys** to `src/i18n/index.ts`:
   - Provider name in both zh-CN and en-US

5. **Write tests** for the new provider's latency detection.

## Testing

### Test Framework

We use **Vitest** for unit and integration tests.

```bash
# Run all tests
npm test

# Run specific test file
npx vitest run src/__tests__/encryption.test.ts

# Run with coverage
npm run test:coverage

# Watch mode
npx vitest
```

### Test Organization

| File | Tests | Purpose |
|------|-------|---------|
| `encryption.test.ts` | 6 | safeStorage encryption/decryption logic |
| `latency.test.ts` | 14 | Latency detection paths and error handling |
| `oauth.test.ts` | 11 | OAuth flow, state validation, token parsing |
| `usage.test.ts` | 4 | Usage recording, 30-day retention, aggregation |
| `integration.test.ts` | 17 | End-to-end user flows (providers, sync, validation) |
| `clipboard.test.ts` | 16 | Clipboard auto-clear and timer management |
| `audit.test.ts` | 4 | Credential access audit logging |
| `audit-integration.test.ts` | 2 | Audit log UI integration |
| `clipboard-integration.test.ts` | 3 | Clipboard integration with ProviderDetail |
| `metadata.test.ts` | 6 | Release metadata parsing and validation |
| `provider-card-coverage.test.ts` | 16 | ProviderCard component source analysis |
| `settings-modal-coverage.test.ts` | 30 | SettingsModal component source analysis |
| `app-coverage.test.ts` | 48 | App root component source analysis |
| `onboarding-flow-coverage.test.ts` | 43 | OnboardingFlow component source analysis |

### Writing Tests

- Test **behavior**, not implementation: `expect(result).toBe('expected')` not `expect(mock).toHaveBeenCalled()`
- Cover **both paths** of every conditional
- Include **edge cases**: empty input, null values, boundary conditions
- Never include real API keys in tests — use mock values like `sk-test123`

### Test Expectations

- **100% coverage is the goal** — every untested path is where bugs hide
- When adding a new function, write a corresponding test
- When fixing a bug, write a regression test
- When adding error handling, write a test that triggers the error
- Never commit code that makes existing tests fail

## Code Style

- **TypeScript strict mode** — no `any` unless absolutely necessary
- **Component naming** — PascalCase for components, camelCase for utilities
- **CSS** — use CSS variables from `tokens.css`, avoid hardcoded values
- **Error handling** — always catch and provide user-facing messages
- **i18n** — all user-visible text must use `t()` keys

## Pull Request Guidelines

### Before Submitting

- [ ] All tests pass (`npm test`)
- [ ] Type check passes (`npm run typecheck`)
- [ ] No hardcoded secrets or credentials
- [ ] New features have tests
- [ ] Documentation updated if behavior changed

### PR Description

Include:
- **What** changed and **why**
- **How to test** the changes
- **Screenshots** for UI changes
- **Breaking changes** (if any)

### Review Process

1. CI runs type check and tests automatically
2. At least one maintainer reviews the code
3. Address review comments
4. PR is merged to `master`

## Release Process

See [RELEASE.md](RELEASE.md) for the release contract.

In short:
1. Update `VERSION`
2. Add matching notes to `CHANGELOG.md`
3. Merge to `master`
4. CI auto-tags and publishes the release

## Getting Help

- **Bugs:** Open a [GitHub Issue](https://github.com/Beyfish/llm-status/issues)
- **Questions:** Start a [GitHub Discussion](https://github.com/Beyfish/llm-status/discussions)
- **Security:** See [SECURITY.md](SECURITY.md)

## Code of Conduct

Be respectful, constructive, and inclusive. We welcome contributors of all experience levels.
