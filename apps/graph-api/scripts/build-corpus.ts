import { mkdirSync, readFileSync, writeFileSync } from 'fs';
import path from 'path';

const REPO_ROOT = path.resolve(__dirname, '../../../');
const CORPUS_SOURCE = path.join(REPO_ROOT, 'assets/ignore/corpus-source.json');
const CORPUS_DIR = path.join(__dirname, '../corpus');
const DATA_DIR = path.join(__dirname, '../src/data');

// Source key → canonical position definition.
// The source uses 'crowns' (old schema); canonical name is 'Crown'.
const POSITION_MAP: Record<string, { index: number; name: string; displayName: string; description: string }> = {
  situation: {
    index: 0,
    name: 'situation',
    displayName: 'Situation',
    description:
      'The heart of the matter — the central issue or energy currently surrounding the querent. This card represents where the querent stands right now.',
  },
  challenge: {
    index: 1,
    name: 'challenge',
    displayName: 'Challenges',
    description:
      'What crosses or challenges the querent. This card shows the immediate obstacle, conflict, or complicating force acting against the central situation.',
  },
  crowns: {
    index: 2,
    name: 'crown',
    displayName: 'Crown',
    description:
      'The best possible outcome or the highest aspiration the querent can achieve in this situation. It also represents conscious thoughts and ideals at play.',
  },
  past: {
    index: 3,
    name: 'past',
    displayName: 'Past',
    description:
      'Recent past events or influences that have shaped the current situation. This energy is moving away but still has residual effect on the present.',
  },
  root: {
    index: 4,
    name: 'root',
    displayName: 'Root',
    description:
      'The foundation or root cause beneath the situation. This card reveals unconscious influences, hidden motivations, or the deep ground from which the situation grows.',
  },
  future: {
    index: 5,
    name: 'future',
    displayName: 'Future',
    description:
      "The near future — what is coming into being. This energy is approaching and will soon become part of the querent's experience.",
  },
  self: {
    index: 6,
    name: 'self',
    displayName: 'Self',
    description:
      "The querent's own position, attitude, and approach to the situation. This card reflects how the querent sees themselves and the role they are playing.",
  },
  influences: {
    index: 7,
    name: 'influences',
    displayName: 'Influences',
    description:
      "External influences — the environment, the people around the querent, or outside forces that are shaping the situation beyond the querent's control.",
  },
  hope: {
    index: 8,
    name: 'hope',
    displayName: 'Hopes and Fears',
    description:
      'What the querent hopes for or fears most deeply. This card often reveals a paradox: the hope and the fear can be the same thing viewed from different angles.',
  },
  outcome: {
    index: 9,
    name: 'outcome',
    displayName: 'Outcome',
    description:
      'The likely outcome if the current path continues. This is not fixed fate — it reflects the trajectory given present energies and choices.',
  },
};

type SourceCard = {
  index: number;
  name: string;
  title?: string;
  type?: string;
  number?: string;
  description?: string;
  keywords?: string;
  reversedKeywords?: string;
  image?: string;
  element?: string;
  arcana?: string;
  hex?: string;
  celtic_cross: {
    upright: Record<string, string>;
    reversed: Record<string, string>;
  };
  __collections__: Record<string, unknown>;
};

type CorpusSource = {
  __collections__: {
    cards: Record<string, SourceCard>;
    [key: string]: unknown;
  };
};

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function buildCardDocument(card: SourceCard): string {
  const lines: string[] = [];

  lines.push(`# ${card.name} (index: ${card.index})`);
  if (card.type || card.arcana) {
    lines.push(`Type: ${card.type ?? ''} | Arcana: ${card.arcana ?? ''}`);
  }
  if (card.element) lines.push(`Element: ${card.element}`);
  lines.push('');

  if (card.description) {
    lines.push('## Description');
    lines.push(card.description.trim());
    lines.push('');
  }

  if (card.keywords) {
    lines.push('## Keywords (Upright)');
    lines.push(card.keywords.trim());
    lines.push('');
  }

  if (card.reversedKeywords) {
    lines.push('## Keywords (Reversed)');
    lines.push(card.reversedKeywords.trim());
    lines.push('');
  }

  lines.push('## Celtic Cross Meanings');

  const sortedPositions = Object.entries(POSITION_MAP).sort(([, a], [, b]) => a.index - b.index);

  for (const [sourceKey, position] of sortedPositions) {
    const upright = card.celtic_cross.upright[sourceKey];
    const reversed = card.celtic_cross.reversed[sourceKey];

    if (!upright || !reversed) {
      process.stderr.write(
        `Warning: missing ${position.displayName} meaning for card ${card.index} (${card.name})\n`
      );
      continue;
    }

    lines.push('');
    lines.push(`### ${position.displayName} (Position ${position.index})`);
    lines.push(`**Upright:** ${upright.trim()}`);
    lines.push(`**Reversed:** ${reversed.trim()}`);
  }

  return lines.join('\n');
}

function buildPositionDocument(
  position: { index: number; name: string; displayName: string; description: string }
): string {
  return [
    `# ${position.displayName} — Celtic Cross Position ${position.index}`,
    '',
    '## Significance',
    position.description,
    '',
    '## Interpretive Lens',
    `When reading any card in the ${position.displayName} position, the reader should consider how the card's energy specifically relates to: ${position.description.toLowerCase()}`,
  ].join('\n');
}

function main() {
  const raw = readFileSync(CORPUS_SOURCE, 'utf-8');
  const source: CorpusSource = JSON.parse(raw);
  const cardsMap = source.__collections__?.cards;

  if (!cardsMap || typeof cardsMap !== 'object') {
    throw new Error(`corpus-source.json is missing __collections__.cards: ${CORPUS_SOURCE}`);
  }

  const cards = Object.values(cardsMap).filter(
    (c): c is SourceCard => typeof c === 'object' && c !== null && typeof c.index === 'number'
  );

  if (cards.length === 0) {
    throw new Error('No valid cards found in corpus-source.json');
  }

  mkdirSync(path.join(CORPUS_DIR, 'cards'), { recursive: true });
  mkdirSync(path.join(CORPUS_DIR, 'positions'), { recursive: true });
  mkdirSync(DATA_DIR, { recursive: true });

  // Write card corpus documents
  for (const card of cards) {
    const doc = buildCardDocument(card);
    const fileName = `card-${card.index}-${slugify(card.name)}.md`;
    writeFileSync(path.join(CORPUS_DIR, 'cards', fileName), doc, 'utf-8');
  }
  console.log(`Wrote ${cards.length} card documents to corpus/cards/`);

  // Write position corpus documents
  const positions = Object.values(POSITION_MAP).sort((a, b) => a.index - b.index);
  for (const position of positions) {
    const doc = buildPositionDocument(position);
    writeFileSync(path.join(CORPUS_DIR, 'positions', `${position.name}.md`), doc, 'utf-8');
  }
  console.log(`Wrote ${positions.length} position documents to corpus/positions/`);

  // Write runtime card metadata (stripped — no meanings, used for index lookups at API runtime)
  const cardMetadata = cards
    .map(({ index, name, title, type, number: numeral, description, keywords, reversedKeywords }) => ({
      index,
      name,
      title: title ?? '',
      type: type ?? '',
      numeral: numeral ?? '',
      description: description ?? '',
      keywords: keywords ?? '',
      reversedKeywords: reversedKeywords ?? '',
    }))
    .sort((a, b) => a.index - b.index);

  writeFileSync(path.join(DATA_DIR, 'cards.json'), JSON.stringify(cardMetadata, null, 2), 'utf-8');
  console.log(`Wrote src/data/cards.json (${cardMetadata.length} cards)`);

  // Write runtime spread position metadata (canonical index → display mapping)
  writeFileSync(
    path.join(DATA_DIR, 'spread-positions.json'),
    JSON.stringify(positions, null, 2),
    'utf-8'
  );
  console.log(`Wrote src/data/spread-positions.json (${positions.length} positions)`);
}

main();
