import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import {
    CanonicalCard,
    CanonicalCollection,
    CanonicalCorrespondence,
    CanonicalCorpus,
    CanonicalSpread,
    CorpusSource,
    LegacyPositionMeaning,
    RelationshipRule,
    SpreadNarrativeEdge,
    ThemeFragment
} from './canonical-types';
import { CANONICAL_FILE_NAMES, CANONICAL_SCHEMA_VERSION } from './corpus-constants';
import {
    FirestoreCard,
    FirestoreCorrespondence,
    FirestoreCorpusExport,
    FirestoreSpreadPosition
} from './types';

const LEGACY_SOURCE_ID = 'legacy-corpus-source';

const NARRATIVE_EDGE_CANDIDATES: SpreadNarrativeEdge[] = [
    {
        id: 'challenge-modifies-situation',
        fromPositionId: 'challenge',
        toPositionId: 'situation',
        relationship: 'modifies'
    },
    {
        id: 'hope-colors-outcome',
        fromPositionId: 'hope',
        toPositionId: 'outcome',
        relationship: 'colors'
    },
    {
        id: 'past-informs-situation',
        fromPositionId: 'past',
        toPositionId: 'situation',
        relationship: 'informs'
    },
    {
        id: 'root-explains-situation',
        fromPositionId: 'root',
        toPositionId: 'situation',
        relationship: 'explains'
    },
    {
        id: 'self-meets-influences',
        fromPositionId: 'self',
        toPositionId: 'influences',
        relationship: 'meets'
    }
];

const NAMED_EDGE_FACTS: Record<SpreadNarrativeEdge['relationship'], string> = {
    colors: 'The source position colors how the target position is expressed.',
    explains: 'The source position helps explain the target position.',
    informs: 'The source position informs the target position.',
    meets: 'The source and target positions describe perspectives that meet.',
    modifies: 'The source position modifies the target position.'
};

const asCollection = <T>(items: T[]): CanonicalCollection<T> => ({
    schemaVersion: CANONICAL_SCHEMA_VERSION,
    items
});

const toText = (value: unknown): string =>
    typeof value === 'string' ? value.trim() : '';

const splitList = (value: unknown): string[] =>
    toText(value)
        .split(',')
        .map(item => item.trim())
        .filter(Boolean);

const slugify = (value: string): string =>
    value
        .toLowerCase()
        .replace(/&/g, ' and ')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

const lexicalById = <T extends { id: string }>(left: T, right: T): number =>
    left.id.localeCompare(right.id);

const cardIndex = (card: FirestoreCard): number =>
    typeof card.index === 'number' && Number.isFinite(card.index) ? card.index : -1;

const sourceItems = (): CorpusSource[] => [
    {
        id: LEGACY_SOURCE_ID,
        title: 'Legacy Simple Tarot corpus',
        editorialNotes:
            'Mechanically migrated from assets/ignore/corpus-source.json without editorial rewriting.'
    }
];

const attributeValue = (
    key: string,
    value: unknown
): string | number | string[] | undefined => {
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string' && value.trim()) {
        return key === 'keywords' || key === 'zodiac' ? splitList(value) : value.trim();
    }
    if (value && typeof value === 'object' && !Array.isArray(value)) {
        return JSON.stringify(value);
    }

    return undefined;
};

const correspondenceAttributes = (
    value: FirestoreCorrespondence
): Record<string, string | number | string[]> =>
    Object.fromEntries(
        Object.entries(value)
            .filter(([key]) => key !== '__collections__')
            .map(([key, fieldValue]) => [key, attributeValue(key, fieldValue)] as const)
            .filter((entry): entry is [string, string | number | string[]] =>
                entry[1] !== undefined
            )
            .sort(([left], [right]) => left.localeCompare(right))
    );

const migrateCorrespondenceCollection = (
    kind: CanonicalCorrespondence['kind'],
    values: Record<string, FirestoreCorrespondence>
): CanonicalCorrespondence[] =>
    Object.entries(values).map(([name, value]) => ({
        id: `${kind}-${slugify(name)}`,
        kind,
        name,
        attributes: correspondenceAttributes(value),
        sourceIds: [LEGACY_SOURCE_ID]
    }));

const migrateCorrespondences = (source: FirestoreCorpusExport): CanonicalCorrespondence[] => {
    const collections = source.__collections__ ?? {};
    const cards = Object.values(collections.cards ?? {});
    const arcanaValues = [...new Set(cards.map(card => toText(card.arcana)).filter(Boolean))];
    const numberValues = [...new Set(cards.map(card => toText(card.number)).filter(Boolean))];

    return [
        ...migrateCorrespondenceCollection('alphabet', collections.alphabet ?? {}),
        ...arcanaValues.map(name => ({
            id: `arcana-${slugify(name)}`,
            kind: 'arcana' as const,
            name,
            attributes: {},
            sourceIds: [LEGACY_SOURCE_ID]
        })),
        ...migrateCorrespondenceCollection('element', collections.elements ?? {}),
        ...numberValues.map(name => ({
            id: `number-${slugify(name)}`,
            kind: 'number' as const,
            name,
            attributes: {},
            sourceIds: [LEGACY_SOURCE_ID]
        })),
        ...migrateCorrespondenceCollection('sephiroth', collections.sephiroth ?? {}),
        ...migrateCorrespondenceCollection('suit', collections.suits ?? {})
    ].sort(lexicalById);
};

const cardAttributes = (card: FirestoreCard): Record<string, string | number> => {
    const candidates: Record<string, unknown> = {
        color: card.color,
        decan: card.decan,
        element: card.element,
        hex: card.hex,
        image: card.image,
        number: card.number,
        path: card.path,
        type: card.type
    };

    return Object.fromEntries(
        Object.entries(candidates)
            .map(([key, value]) => [key, attributeValue(key, value)] as const)
            .filter((entry): entry is [string, string | number] =>
                typeof entry[1] === 'string' || typeof entry[1] === 'number'
            )
    );
};

const cardCorrespondenceIds = (
    card: FirestoreCard,
    knownCorrespondenceIds: Set<string>
): string[] => {
    const candidates = [
        ['arcana', toText(card.arcana)],
        ['element', toText(card.element)],
        ['suit', toText(card.type)],
        ['number', toText(card.number)],
        ['sephiroth', toText(card.path)],
        ['alphabet', toText(card.decan)]
    ] as const;

    return candidates
        .map(([kind, value]) => `${kind}-${slugify(value)}`)
        .filter(id => knownCorrespondenceIds.has(id))
        .sort();
};

const migrateCards = (
    source: FirestoreCorpusExport,
    knownCorrespondenceIds: Set<string>
): CanonicalCard[] =>
    Object.entries(source.__collections__?.cards ?? {})
        .sort(([leftName, left], [rightName, right]) => {
            const indexDifference = cardIndex(left) - cardIndex(right);

            return indexDifference || leftName.localeCompare(rightName);
        })
        .map(([documentName, card]) => {
            const name = toText(card.name) || documentName;
            const arcana = toText(card.arcana);
            if (arcana !== 'major' && arcana !== 'minor') {
                throw new Error(`Card ${name} has invalid arcana.`);
            }

            return {
                id: slugify(name),
                index: cardIndex(card),
                name,
                title: toText(card.title) || name,
                arcana,
                description: toText(card.description),
                uprightKeywords: splitList(card.keywords),
                reversedKeywords: splitList(card.reversedKeywords),
                correspondenceIds: cardCorrespondenceIds(card, knownCorrespondenceIds),
                attributes: cardAttributes(card)
            };
        });

const isSpreadPosition = (value: unknown): value is FirestoreSpreadPosition =>
    typeof value === 'object' && value !== null && !Array.isArray(value);

const migrateSpreads = (source: FirestoreCorpusExport): CanonicalSpread[] =>
    Object.values(source.__collections__?.spreads ?? {})
        .map(spread => {
            const sourceName = toText(spread.name);
            const id = slugify(sourceName);
            const positions = (Array.isArray(spread.positions) ? spread.positions : [])
                .filter(isSpreadPosition)
                .map((position, order) => {
                    const positionId = slugify(toText(position.name));
                    const description = toText(position.description);

                    return {
                        id: positionId,
                        displayName: toText(position.displayName) || toText(position.name),
                        description,
                        lens: description,
                        order
                    };
                });
            const positionIds = new Set(positions.map(position => position.id));

            return {
                id,
                displayName: toText(spread.displayName) || sourceName,
                positions,
                narrativeEdges: NARRATIVE_EDGE_CANDIDATES.filter(
                    edge =>
                        positionIds.has(edge.fromPositionId) &&
                        positionIds.has(edge.toPositionId)
                )
            };
        })
        .sort(lexicalById);

const themeText = (kind: string, name: string, value: FirestoreCorrespondence): string => {
    let fields: string[];
    if (kind === 'element') {
        fields = [toText(value.energy), toText(value.keywords)];
    } else if (kind === 'suit') {
        fields = [toText(value.dominant), toText(value.keywords), toText(value.zodiac)];
    } else {
        fields = [
            toText(value.title),
            toText(value.subtitle),
            toText(value.meaning),
            toText(value.represents) || toText(value.represent),
            toText(value.keywords)
        ];
    }

    return [`${kind}: ${name}`, ...fields.filter(Boolean)].join('. ');
};

const migrateThemes = (source: FirestoreCorpusExport): ThemeFragment[] => {
    const collections = source.__collections__ ?? {};
    const themeCollections = [
        ['element', collections.elements ?? {}, 'card.element'],
        ['sephiroth', collections.sephiroth ?? {}, 'card.path'],
        ['suit', collections.suits ?? {}, 'card.suit']
    ] as const;

    return themeCollections
        .flatMap(([kind, values, field]) =>
            Object.entries(values).flatMap(([name, value]) => {
                const text = themeText(kind, name, value);
                if (text === `${kind}: ${name}`) return [];
                const subjectId = `${kind}-${slugify(name)}`;
                const fragment: ThemeFragment = {
                    id: `${subjectId}-theme`,
                    kind: 'correspondence-theme',
                    subjects: [{ type: kind, id: subjectId }],
                    theme: text,
                    when: { eq: [{ field }, slugify(name)] },
                    polarity: 'contextual',
                    status: 'approved',
                    sourceIds: [LEGACY_SOURCE_ID]
                };

                return [fragment];
            })
        )
        .sort(lexicalById);
};

const migrateLegacyMeanings = (
    source: FirestoreCorpusExport,
    cards: CanonicalCard[],
    spreads: CanonicalSpread[]
): LegacyPositionMeaning[] => {
    const sourceCards = source.__collections__?.cards ?? {};
    const sourceCardByCanonicalId = new Map(
        Object.entries(sourceCards).map(([documentName, card]) => [
            slugify(toText(card.name) || documentName),
            card
        ])
    );

    return spreads
        .flatMap(spread =>
            cards.flatMap(card => {
                const sourceCard = sourceCardByCanonicalId.get(card.id);
                if (!sourceCard || spread.id !== 'celtic-cross') return [];

                return (['upright', 'reversed'] as const).flatMap(orientation =>
                    spread.positions.flatMap(position => {
                        const meanings = sourceCard.celtic_cross?.[orientation] ?? {};
                        const meaning = toText(meanings[position.id]);
                        if (!meaning) return [];

                        return [
                            {
                                id: `${spread.id}-${position.id}-${card.id}-${orientation}`,
                                spreadId: spread.id,
                                positionId: position.id,
                                cardId: card.id,
                                orientation,
                                meaning,
                                sourceIds: [LEGACY_SOURCE_ID],
                                status: 'approved' as const
                            }
                        ];
                    })
                );
            })
        )
        .sort(lexicalById);
};

const relationshipRules = (spreads: CanonicalSpread[]): RelationshipRule[] => {
    const namedRules = spreads.flatMap(spread =>
        spread.narrativeEdges.map(edge => ({
            id: edge.id,
            scope: 'named-pair' as const,
            ruleType: 'named-position-edge' as const,
            priority: 100,
            condition: { type: 'named-position-edge' as const, edgeId: edge.id },
            fact: NAMED_EDGE_FACTS[edge.relationship],
            sourceIds: [LEGACY_SOURCE_ID]
        }))
    );
    const wholeSpreadRules: RelationshipRule[] = [
        {
            id: 'whole-spread-element-dominance',
            scope: 'whole-spread',
            ruleType: 'element-dominance',
            priority: 80,
            condition: { type: 'dominance', subject: 'element', minimumCount: 3 },
            fact: 'One element is dominant across the spread.',
            sourceIds: [LEGACY_SOURCE_ID]
        },
        {
            id: 'whole-spread-major-arcana-weight',
            scope: 'whole-spread',
            ruleType: 'major-arcana-weight',
            priority: 70,
            condition: { type: 'major-arcana-weight', minimumCount: 5 },
            fact: 'Major Arcana carry substantial weight across the spread.',
            sourceIds: [LEGACY_SOURCE_ID]
        },
        {
            id: 'whole-spread-number-repetition',
            scope: 'whole-spread',
            ruleType: 'number-repetition',
            priority: 60,
            condition: { type: 'number-repetition', minimumCount: 2 },
            fact: 'A card number repeats across the spread.',
            sourceIds: [LEGACY_SOURCE_ID]
        },
        {
            id: 'whole-spread-reversed-orientation-balance',
            scope: 'whole-spread',
            ruleType: 'orientation-balance',
            priority: 50,
            condition: {
                type: 'orientation-balance',
                orientation: 'reversed',
                minimumCount: 6
            },
            fact: 'Reversed cards dominate the spread.',
            sourceIds: [LEGACY_SOURCE_ID]
        },
        {
            id: 'whole-spread-suit-dominance',
            scope: 'whole-spread',
            ruleType: 'suit-dominance',
            priority: 80,
            condition: { type: 'dominance', subject: 'suit', minimumCount: 3 },
            fact: 'One suit is dominant across the spread.',
            sourceIds: [LEGACY_SOURCE_ID]
        }
    ];

    return [...namedRules, ...wholeSpreadRules].sort(lexicalById);
};

export function migrateFirestoreCorpus(source: FirestoreCorpusExport): CanonicalCorpus {
    const correspondences = migrateCorrespondences(source);
    const cards = migrateCards(source, new Set(correspondences.map(item => item.id)));
    const spreads = migrateSpreads(source);

    return {
        cards: asCollection(cards),
        spreads: asCollection(spreads),
        correspondences: asCollection(correspondences),
        themeFragments: asCollection(migrateThemes(source)),
        relationshipRules: asCollection(relationshipRules(spreads)),
        legacyPositionMeanings: asCollection(
            migrateLegacyMeanings(source, cards, spreads)
        ),
        sources: asCollection(sourceItems())
    };
}

export function writeCanonicalCorpus(
    corpus: CanonicalCorpus,
    outputDirectory: string
): string[] {
    mkdirSync(outputDirectory, { recursive: true });
    const collections = {
        cards: corpus.cards,
        correspondences: corpus.correspondences,
        legacyPositionMeanings: corpus.legacyPositionMeanings,
        relationshipRules: corpus.relationshipRules,
        sources: corpus.sources,
        spreads: corpus.spreads,
        themeFragments: corpus.themeFragments
    };

    return Object.entries(CANONICAL_FILE_NAMES).map(([key, fileName]) => {
        const outputPath = join(outputDirectory, fileName);
        const collection = collections[key as keyof typeof collections];
        writeFileSync(outputPath, `${JSON.stringify(collection, null, 2)}\n`, 'utf8');

        return outputPath;
    });
}
