# Release Process

## Source of truth

- `VERSION` defines the next release version
- `CHANGELOG.md` must contain a matching `## [x.y.z] - YYYY-MM-DD` section

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
