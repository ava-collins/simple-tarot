# Cards Package

`@simpletarot/cards` owns the generated Rider Waite card SVG components and the
`useSvgCards` hook used by the UI package to render card faces.

The package exists so card rendering is separate from `@simpletarot/hooks`.
`@simpletarot/hooks` should stay focused on application hooks and data access,
while `@simpletarot/cards` owns the card image component surface and the SVG
generation utility.

## Package Responsibilities

- Generate React Native SVG card components from raw SVG source files.
- Export those generated card components through suite-level indexes.
- Export `useSvgCards`, which maps a tarot deck index to the matching card
  component.
- Keep generated TSX card files out of git because the source SVG files live
  outside the repository.

## Usage

UI components should import `useSvgCards` from `@simpletarot/cards`.

```tsx
import { useSvgCards } from '@simpletarot/cards';

const cardFace = useSvgCards(cardIndex, {
    width: 100,
    height: 200,
    opacity: 1
});
```

`useSvgCards(cardIndex, props)` returns a React element for a valid card index
and `null` when the index does not map to a generated card.

The current deck index order is:

- `0` through `21`: major arcana
- `22` through `35`: wands
- `36` through `49`: cups
- `50` through `63`: swords
- `64` through `77`: coins

## Generating Cards

The generator uses SVGR to transform raw SVG files into React Native SVG
components. It reads the source directory from `CARD_SVG_SOURCE_DIR`; the script
loads `.env` with `dotenv`, so local development can set the variable there.

```sh
CARD_SVG_SOURCE_DIR="/Users/ava/Library/Mobile Documents/iCloud~com~belightsoft~Amadine/Documents/tarot/smith-waite"
```

Run the generator from the repository root:

```sh
yarn workspace @simpletarot/cards generate:cards
```

The source directory should contain one folder for each suite:

- `major-arcana`
- `wands`
- `cups`
- `swords`
- `coins`

The generated output mirrors that suite structure under
`packages/cards/src/cards/`. That directory is intentionally ignored by git.
After cloning the repo or cleaning generated files, run the generator before
building or rendering UI stories that depend on card faces.

## Validation

Useful checks after changing this package:

```sh
yarn workspace @simpletarot/cards test
yarn workspace @simpletarot/cards build-types
yarn workspaces foreach -A run build-types
yarn lint
```

For UI validation, run Storybook and inspect `Atoms/Card` -> `FaceCard`.

```sh
yarn workspace @simpletarot/ui storybook
```

The `FaceCard` story is the practical render check because it exercises the UI
component import from `@simpletarot/cards`, the `useSvgCards` hook, and the
generated React Native SVG component output together.
