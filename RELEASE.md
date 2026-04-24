# Release Process

## Source of truth

- `VERSION` defines the next release version
- `CHANGELOG.md` must contain a matching `## [x.y.z] - YYYY-MM-DD` section

## Critical: VERSION file encoding

- `VERSION` must be **UTF-8 without BOM** (byte order mark)
- A BOM character (`U+FEFF`) causes invisible corruption in release tags
- Example: `v﻿0.2.0.9` looks identical to `v0.2.0.9` but contains an invisible character
- The auto-tag workflow now strips BOM, but pre-commit validation is safer
- Use `xxd VERSION | head -1` to verify: should start with `30 2E` (decimal), not `EF BB BF` (BOM)

## Happy path

1. Update `VERSION`
2. Add the matching `CHANGELOG.md` entry
3. Merge to `master`
4. GitHub Actions auto-tags `v<version>`
5. Tag push triggers release build
6. GitHub Release is created with artifacts and the matching changelog notes

## Failure modes

- If `VERSION` changes but `CHANGELOG.md` does not match, auto-tagging fails
- If tests or builds fail, no GitHub Release is created
- If the tag already exists, the auto-tag workflow exits without creating a duplicate
- If `VERSION` contains BOM, tags will have invisible corruption (now guarded in workflow)
