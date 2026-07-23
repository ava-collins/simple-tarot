import { ReadingRequest } from '../readings/contracts';
import {
    COMPOSER_SCHEMA_VERSION,
    SUPPORTED_RELATIONSHIP_TYPES
} from './constants';

export type ComposerOrientation = 'upright' | 'reversed';
export type ComposerArcana = 'major' | 'minor';
export type PredicateValue = string | number | boolean;

export type SubjectKind =
    | 'alphabet'
    | 'arcana'
    | 'card'
    | 'element'
    | 'number'
    | 'sephiroth'
    | 'suit';

export type SubjectReference = {
    id: string;
    type: SubjectKind;
};

export type ComposerCardV1 = {
    id: string;
    index: number;
    name: string;
    title: string;
    arcana: ComposerArcana;
    description: string;
    uprightKeywords: string[];
    reversedKeywords: string[];
    correspondenceIds: string[];
    attributes: Record<string, string | number>;
};

export type ClassicalElement = 'air' | 'fire' | 'water' | 'earth';
export type TarotSuit = 'swords' | 'wands' | 'cups' | 'coins';

export type ComposerCardV2 = ComposerCardV1 & {
    number: number;
    suit?: TarotSuit;
    element: ClassicalElement;
    uprightKeywordSourceIds: string[];
    reversedKeywordSourceIds: string[];
};

export type ComposerCard = ComposerCardV1 | ComposerCardV2;

export type SpreadPosition = {
    id: string;
    displayName: string;
    description: string;
    lens: string;
    order: number;
};

export type SpreadNarrativeEdge = {
    id: string;
    fromPositionId: string;
    toPositionId: string;
    relationship: 'colors' | 'explains' | 'informs' | 'meets' | 'modifies';
};

export type ComposerSpread = {
    id: string;
    displayName: string;
    positions: SpreadPosition[];
    narrativeEdges: SpreadNarrativeEdge[];
};

export type ComposerCorrespondence = {
    id: string;
    kind: SubjectKind;
    name: string;
    attributes: Record<string, string | number | string[]>;
    sourceIds: string[];
};

export type CorpusPredicate =
    | { eq: [{ field: string }, PredicateValue] }
    | { in: [{ field: string }, Array<string | number>] }
    | { all: CorpusPredicate[] }
    | { any: CorpusPredicate[] }
    | { not: CorpusPredicate };

export type ThemeFragment = {
    id: string;
    kind: 'correspondence-theme';
    subjects: SubjectReference[];
    theme: string;
    when: CorpusPredicate;
    polarity: 'contextual' | 'reinforcing' | 'challenging';
    status: 'approved';
    sourceIds: string[];
};

export type RelationshipCondition =
    | { type: 'named-position-edge'; edgeId: string }
    | { type: 'dominance'; subject: 'element' | 'suit'; minimumCount: number }
    | { type: 'major-arcana-weight'; minimumCount: number }
    | { type: 'number-repetition'; minimumCount: number }
    | {
          type: 'orientation-balance';
          orientation: ComposerOrientation;
          minimumCount: number;
      };

export type RelationshipRuleType = (typeof SUPPORTED_RELATIONSHIP_TYPES)[number];

export type RelationshipRule = {
    id: string;
    scope: 'card-local' | 'named-pair' | 'whole-spread';
    ruleType: RelationshipRuleType;
    priority: number;
    condition: RelationshipCondition;
    fact: string;
    sourceIds: string[];
};

export type LegacyPositionMeaning = {
    id: string;
    spreadId: string;
    positionId: string;
    cardId: string;
    orientation: ComposerOrientation;
    meaning: string;
    sourceIds: string[];
    status: 'approved';
};

export type SingleCardTheme =
    | {
          id: string;
          dimension: 'arcana';
          value: ComposerArcana;
          theme: string;
          status: 'approved';
          sourceIds: string[];
      }
    | {
          id: string;
          dimension: 'suit';
          value: TarotSuit;
          theme: string;
          status: 'approved';
          sourceIds: string[];
      }
    | {
          id: string;
          dimension: 'number';
          value: number;
          theme: string;
          status: 'approved';
          sourceIds: string[];
      }
    | {
          id: string;
          dimension: 'element';
          value: ClassicalElement;
          theme: string;
          status: 'approved';
          sourceIds: string[];
      };

type ComposerBundleCommon = {
    corpusVersion: string;
    spreadsById: Record<string, ComposerSpread>;
    correspondencesById: Record<string, ComposerCorrespondence>;
    approvedThemeFragments: ThemeFragment[];
    relationshipRules: RelationshipRule[];
    legacyPositionMeaningsByKey: Record<string, LegacyPositionMeaning>;
};

export type ComposerBundleV1 = ComposerBundleCommon & {
    schemaVersion: 1;
    cardsById: Record<string, ComposerCardV1>;
};

export type ComposerBundleV2 = ComposerBundleCommon & {
    schemaVersion: typeof COMPOSER_SCHEMA_VERSION;
    cardsById: Record<string, ComposerCardV2>;
    approvedSingleCardThemes: SingleCardTheme[];
};

export type ComposerBundle = ComposerBundleV1 | ComposerBundleV2;

export type CardPredicateInput = {
    card: ComposerCard;
    correspondencesById: Record<string, ComposerCorrespondence>;
    orientation: ComposerOrientation;
};

export type NormalizedComposerCard = {
    card: ComposerCard;
    orientation: ComposerOrientation;
    presentationPosition: string;
    position?: SpreadPosition;
};

export type NormalizedComposerRequest = {
    spreadMode: 'single-card' | 'celtic-cross';
    spread?: ComposerSpread;
    cards: NormalizedComposerCard[];
};

export type ComposedTheme = {
    id: string;
    polarity: ThemeFragment['polarity'];
    theme: string;
};

export type ComposedCardContextV1 = {
    cardId: string;
    cardIndex: number;
    cardName: string;
    title: string;
    arcana: ComposerArcana;
    description: string;
    orientation: ComposerOrientation;
    orientationKeywords: string[];
    presentationPosition: string;
    position?: SpreadPosition;
    exactMeaning?: string;
    themes: ComposedTheme[];
};

export type ComposedSingleCardContextV2 = {
    cardId: string;
    cardIndex: number;
    cardName: string;
    title: string;
    arcana: ComposerArcana;
    suit?: TarotSuit;
    number: number;
    element: ClassicalElement;
    orientation: ComposerOrientation;
    orientationKeywords: string[];
    presentationPosition: string;
    singleCardThemes: SingleCardTheme[];
};

export type ComposedCardContext =
    | ComposedCardContextV1
    | ComposedSingleCardContextV2;

export type RelationshipSupport = {
    cardId: string;
    positionId?: string;
};

export type RelationshipResult = {
    id: string;
    ruleId: string;
    priority: number;
    fact: string;
    supports: RelationshipSupport[];
};

export type ComposedReadingContext = {
    composerSchemaVersion: 1 | 2;
    corpusVersion: string;
    spreadMode: 'single-card' | 'celtic-cross';
    cards: ComposedCardContext[];
    namedPairResults: RelationshipResult[];
    wholeSpreadResults: RelationshipResult[];
};

export type ComposeReadingContext = (
    request: ReadingRequest,
    bundle: ComposerBundle
) => ComposedReadingContext;

export type ActiveReleaseState = {
    stateSchemaVersion: 1;
    environment: 'dev';
    corpusVersion: string;
    releasePrefix: string;
    knowledgeBaseId: string;
    dataSourceId: string;
    ingestionJobId: string;
    completedAt: string;
};

export type ReleaseManifestEntry = {
    path: string;
    role: 'composer' | 'coverage' | 'rag-document' | 'rag-metadata';
    mediaType: string;
    byteSize: number;
    sha256: string;
};

export type ReleaseManifest = {
    manifestSchemaVersion: 1;
    corpusSchemaVersion: 1 | 2;
    corpusVersion: string;
    artifacts: ReleaseManifestEntry[];
    runtimeObjects: string[];
    coverageObjects: string[];
    ingestibleObjects: string[];
};
