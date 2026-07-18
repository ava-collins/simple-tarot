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

export type ComposerCard = {
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

export type ComposerBundle = {
    schemaVersion: typeof COMPOSER_SCHEMA_VERSION;
    corpusVersion: string;
    cardsById: Record<string, ComposerCard>;
    spreadsById: Record<string, ComposerSpread>;
    correspondencesById: Record<string, ComposerCorrespondence>;
    approvedThemeFragments: ThemeFragment[];
    relationshipRules: RelationshipRule[];
    legacyPositionMeaningsByKey: Record<string, LegacyPositionMeaning>;
};

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

export type ComposedCardContext = {
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

