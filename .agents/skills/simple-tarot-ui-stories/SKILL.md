---
name: simple-tarot-ui-stories
description: Use when creating, editing, or reviewing components in Simple Tarot packages/ui/stories, Storybook stories, React Native Web UI states, or exported UI screens/forms.
---

# Simple Tarot UI Stories

## Rule

Every component change in `packages/ui/stories` must create or update a matching Storybook story in the same folder.

## Workflow

1. Before editing a component, find its local story with `rg "<ComponentName>" packages/ui/stories -g '*.stories.tsx'`.
2. If a component file is new, add `<component>.stories.tsx` beside it.
3. If a component gains props, states, callbacks, loading, error, empty, disabled, success, or navigation affordances, update the existing story args to cover those states.
4. Match local code style:
   - use `Meta` and `StoryObj` from `@storybook/react-native-web-vite`
   - keep story titles aligned with folder category, such as `Atoms/*`, `Molecules/*`, `Organisms/*`, `Screens/*`
   - import local MDX docs when the neighboring story does
   - use simple `console.log` callbacks in args, as existing stories do
   - preserve viewport/layout parameters for screen stories; screen components should keep the local `MobileView` / `MobileProviders` template pattern so safe-area and provider behavior remain consistent
   - use `KeyboardAvoidingView` for screen stories/components that include text form input, following existing login/signup/forgot-password screen patterns
5. For behavior stories under `packages/ui/stories/tests`, update play tests only when the changed behavior is interactive and already tested there.
6. Run `yarn workspace @simpletarot/ui build-types` after story/component edits.

## Checks

- No changed UI component should lack a corresponding changed or newly verified story.
- Story args should demonstrate every user-visible state introduced by the component change.
- Do not add stories for non-visual helpers unless they render a component.
