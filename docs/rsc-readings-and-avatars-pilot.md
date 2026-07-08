# RSC Readings and Avatars Pilot

The tarot mobile app uses Expo Server Functions for the authenticated readings flow and avatar thumbnail discovery.

## Scope

-   `apps/tarot/src/readings/server-actions.ts` runs on the server and calls the existing readings REST API.
-   `apps/tarot/src/readings/use-rsc-reading-history.ts` remains a Client Component hook for native screens.
-   `apps/tarot/src/avatars/server-actions.ts` runs on the server and calls the existing `/avatars` REST API.
-   `apps/tarot/src/avatars/use-rsc-avatar-image.ts` remains a Client Component hook for avatar display state and random cycling.
-   `packages/ui/stories/screens/account-screen.tsx` accepts an `avatarSlot` so the Expo app can inject an RSC-backed avatar while Storybook keeps REST/mock behavior.
-   Cognito auth, token storage, navigation, and form state remain client-side.

## Why This Path

Expo RSC support is beta, so this pilot avoids full route-level Server Components and keeps the existing Express API deployment intact. The readings and avatars flows are the best first candidates because they already have serializable request and response contracts.

## Known Limitations

-   Full route-level RSC is not enabled.
-   EAS Update support for Server Components is limited by Expo's current beta status.
-   Production native server deployment needs an explicit EAS Hosting or custom server decision before release.
-   `/avatars` still depends on the existing REST API route and SerpAPI configuration; this pilot moves the mobile call boundary, not the SerpAPI implementation itself.

## Related Docs

-   [Tarot App README](../apps/tarot/README.md#rsc-pilot) documents the mobile app boundary.
-   [REST API README](../apps/api/README.md#endpoints) documents the underlying `/readings` and `/avatars` routes.
-   [Infrastructure README](../apps/infra/README.md#expo-contract) documents the `ApiUrl` handoff used by the app.
-   [Cognito -> Expo Config Contract](./cognito_expo_config_contract.md) documents the public Expo auth configuration that remains client-side.

## Next Candidates

1. Build a server-rendered reading result preview once the reading UI stabilizes.
2. Revisit auth only if the app adopts a server-managed session model.
