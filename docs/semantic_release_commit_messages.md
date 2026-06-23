# Semantic Release Commit Messages

This project uses semantic-release and Conventional Commits to decide when a
package version should change and what should appear in its changelog.

## Format

Write commit messages in this shape:

```text
type(scope): short description
```

The `type` describes the kind of change. The optional `scope` names the app,
package, or area affected. The description should be short, present tense, and
lowercase unless it starts with a proper noun.

Examples:

```text
fix(ui): align card title spacing
feat(tarot): add daily reading spread
docs(release): describe commit message format
chore(graph-api): update generated types
```

## Version Impact

semantic-release reads the commit type to choose the next version.

| Commit type | Release impact | Use for |
| --- | --- | --- |
| `fix` | Patch release | Bug fixes and user-visible corrections |
| `feat` | Minor release | New user-visible behavior or capabilities |
| Breaking change | Major release | Changes that require consumers to update usage |
| `docs` | No release by default | Documentation-only changes |
| `test` | No release by default | Test-only changes |
| `chore` | No release by default | Maintenance work |
| `refactor` | No release by default | Internal code changes without behavior changes |
| `build` | No release by default | Build system and dependency tooling |
| `ci` | No release by default | GitHub Actions and CI changes |

## Breaking Changes

For a breaking change, add `!` after the type or scope:

```text
feat(ui)!: replace reading card props
```

Or include a `BREAKING CHANGE:` footer in the commit body:

```text
feat(hooks): change reading lookup API

BREAKING CHANGE: useReading now requires a reading id instead of a slug.
```

## Scopes

Prefer scopes that match the part of the monorepo you changed:

| Scope | Use for |
| --- | --- |
| `graph-api` | `apps/graph-api` |
| `tarot` | `apps/tarot` |
| `hooks` | `packages/hooks` |
| `ui` | `packages/ui` |
| `release` | semantic-release configuration or workflow changes |
| `workspace` | Yarn workspace configuration |
| `docs` | documentation structure or cross-project docs |

The scope helps humans read history, but semantic-release-monorepo decides which
package receives a release by looking at the files changed by each commit.

## Practical Tips

Use `fix` when users receive corrected behavior.

Use `feat` when users can do something new.

Use `docs`, `chore`, `test`, `refactor`, `build`, or `ci` when the change should
not create a package release by itself.

If a single commit changes multiple packages, semantic-release-monorepo can
consider that commit for each package whose files were touched.
