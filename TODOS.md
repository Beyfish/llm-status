# TODOS.md

Generated: 2026-04-03

## TODO #1: Add inline API key validation

**What:** Validate API key format in real-time as user types/pastes
**Why:** Users are anxious when pasting keys. Instant feedback reduces abandonment and prevents saving invalid keys.
**Pros:** Higher conversion, fewer invalid keys saved, better UX, fewer support requests
**Cons:** Need to maintain per-provider key format patterns; false positives could frustrate users
**Context:** Design review identified this as the highest-anxiety moment in the user journey. Users paste keys from various sources and have no confidence until they run a check.
**Effort:** S (human: ~4 hours / CC: ~15 min)
**Priority:** P1
**Depends on:** None

---

## TODO #2: Add sync conflict resolution

**What:** Version-based conflict detection and user prompt when remote config differs from local
**Why:** Two devices editing simultaneously will cause data loss without conflict handling
**Pros:** Prevents data loss, builds trust for multi-device users, enables safe collaboration
**Cons:** Adds complexity to sync flow; needs UI for conflict resolution
**Context:** Eng Review identified this as CRITICAL for multi-device users. Current sync blindly overwrites remote data.
**Effort:** M (human: ~2 days / CC: ~30 min)
**Priority:** P1
**Depends on:** None

---

## TODO #3: Implement credentialFile import/export

**What:** Complete the stubbed credentialFile.ts with encrypted import/export
**Why:** Currently registered but not implemented; causes silent IPC failures when called
**Pros:** Users can backup and restore all provider configs; enables migration between machines
**Cons:** One more feature to maintain; needs careful encryption handling
**Context:** CEO Review found this as an empty shell that causes silent failures. The handler is registered in main.ts but does nothing.
**Effort:** S (human: ~4 hours / CC: ~15 min)
**Priority:** P1
**Depends on:** None

---

## TODO #4: Add API usage dashboard

**What:** Cross-provider usage, cost, and budget alerts
**Why:** Daily reason to open the app beyond key health; transforms from monitoring tool to daily driver
**Pros:** Increases retention, provides real value, differentiates from simple status tools
**Cons:** Requires billing API access for each provider; some providers don't expose usage APIs
**Context:** CEO Review expansion - accepted as differentiation feature. This is what makes users open the app every morning.
**Effort:** L (human: ~1 week / CC: ~30 min)
**Priority:** P2
**Depends on:** Provider billing API research

---

## TODO #5: Add prompt quick-test

**What:** Text box in ProviderDetail to send a prompt and see response from the selected provider
**Why:** 30-second interaction to compare models without leaving the app
**Pros:** Sticky feature, differentiates from simple status tools, helps users choose providers
**Cons:** Requires actual API calls (costs money); needs rate limiting
**Context:** CEO Review expansion - accepted as delight feature. Users often want to quickly test "does this key work with a real prompt?"
**Effort:** M (human: ~1 day / CC: ~15 min)
**Priority:** P2
**Depends on:** None

---

## TODO #6: Add system tray status indicator

**What:** Native system tray icon showing aggregate provider health (green/yellow/red)
**Why:** Users want to know key status without opening the app; desktop-native advantage
**Pros:** Passive monitoring, differentiates from web tools, builds habit
**Cons:** Platform-specific implementation (Windows/macOS/Linux differ)
**Context:** SELECTIVE EXPANSION accepted in CEO Review. This is the "glance and know" experience.
**Effort:** M (human: ~1 day / CC: ~20 min)
**Priority:** P2
**Depends on:** None

---

## TODO #7: Add key expiry预警 notifications

**What:** Push notification when a key is about to expire (e.g., 7 days before)
**Why:** Proactive is better than reactive; users hate discovering expired keys in production
**Pros:** Prevents outages, builds trust, differentiates from reactive monitoring
**Cons:** Needs expiry date tracking per provider; some providers don't expose expiry
**Context:** SELECTIVE EXPANSION accepted in CEO Review. Uses existing expiresAt field.
**Effort:** S (human: ~4 hours / CC: ~15 min)
**Priority:** P2
**Depends on:** None

---

## TODO #8: Add one-click copy auth curl

**What:** Copy button on each provider that generates a ready-to-use curl command with auth
**Why:** Highest-frequency debugging operation; developers constantly test keys via curl
**Pros:** Saves time, reduces errors, developer-friendly
**Cons:** Minor; mostly convenience
**Context:** SELECTIVE EXPANSION accepted in CEO Review. "curl -H 'Authorization: Bearer sk-xxx' https://api.openai.com/v1/models"
**Effort:** S (human: ~2 hours / CC: ~10 min)
**Priority:** P2
**Depends on:** None

---

## TODO #9: Add environment/project grouping

**What:** Group providers by environment (personal / work / production)
**Why:** Users have different keys for different contexts; flat list becomes unwieldy at scale
**Pros:** Better organization, prevents accidental use of wrong key, scales with user growth
**Cons:** Adds UI complexity; needs migration for existing users
**Context:** SELECTIVE EXPANSION accepted in CEO Review. Natural growth path.
**Effort:** M (human: ~1 day / CC: ~20 min)
**Priority:** P3
**Depends on:** None

---

## TODO #10: Add config backup with encryption

**What:** Encrypted export/import of full app configuration (including secrets)
**Why:** Users need to migrate between machines or recover from data loss
**Pros:** Disaster recovery, machine migration, user confidence
**Cons:** Must handle encryption key portability (safeStorage is machine-specific)
**Context:** Related to credentialFile TODO. safeStorage can't decrypt on a different machine, so need a user-provided passphrase for cross-machine backups.
**Effort:** M (human: ~1 day / CC: ~20 min)
**Priority:** P2
**Depends on:** None
