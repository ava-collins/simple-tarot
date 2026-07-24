import { ReadingRequest } from '../readings/contracts';
import { ComposerBundle } from './contracts';

export const SANITIZED_CORPUS_VERSION = 'a'.repeat(64);

export const sanitizedComposerBundle: ComposerBundle = {
    schemaVersion: 1,
    corpusVersion: SANITIZED_CORPUS_VERSION,
    cardsById: {
        'dawn-keeper': {
            id: 'dawn-keeper',
            index: 0,
            name: 'Dawn Keeper',
            title: 'The First Lantern',
            arcana: 'major',
            description: 'A traveler notices a new horizon.',
            uprightKeywords: ['beginning', 'wonder'],
            reversedKeywords: ['hesitation', 'delay'],
            correspondenceIds: ['ember', 'lantern', 'two'],
            attributes: { path: 'opening' }
        },
        'tide-weaver': {
            id: 'tide-weaver',
            index: 1,
            name: 'Tide Weaver',
            title: 'The Patient Current',
            arcana: 'minor',
            description: 'A guide shapes a steady passage.',
            uprightKeywords: ['patience', 'motion'],
            reversedKeywords: ['stagnation', 'resistance'],
            correspondenceIds: ['ember', 'lantern', 'two'],
            attributes: { path: 'continuance' }
        }
    },
    spreadsById: {
        'celtic-cross': {
            id: 'celtic-cross',
            displayName: 'Ten-Place Reading',
            positions: [
                {
                    id: 'origin',
                    displayName: 'Origin',
                    description: 'What is already present.',
                    lens: 'Read as the starting condition.',
                    order: 0
                },
                {
                    id: 'response',
                    displayName: 'Response',
                    description: 'What answers the starting condition.',
                    lens: 'Read as the immediate response.',
                    order: 1
                },
                {
                    id: 'foundation',
                    displayName: 'Foundation',
                    description: 'What supports the situation.',
                    lens: 'Read as the underlying support.',
                    order: 2
                },
                {
                    id: 'recent',
                    displayName: 'Recent',
                    description: 'What has just shifted.',
                    lens: 'Read as the recent influence.',
                    order: 3
                },
                {
                    id: 'aim',
                    displayName: 'Aim',
                    description: 'What the selection reaches toward.',
                    lens: 'Read as the conscious aim.',
                    order: 4
                },
                {
                    id: 'near',
                    displayName: 'Near',
                    description: 'What is approaching.',
                    lens: 'Read as the near development.',
                    order: 5
                },
                {
                    id: 'self',
                    displayName: 'Self',
                    description: 'How the reader participates.',
                    lens: 'Read as the reader stance.',
                    order: 6
                },
                {
                    id: 'setting',
                    displayName: 'Setting',
                    description: 'What the surroundings contribute.',
                    lens: 'Read as the surrounding setting.',
                    order: 7
                },
                {
                    id: 'hope',
                    displayName: 'Hope',
                    description: 'What is desired or feared.',
                    lens: 'Read as the emotional expectation.',
                    order: 8
                },
                {
                    id: 'outcome',
                    displayName: 'Outcome',
                    description: 'What follows the current pattern.',
                    lens: 'Read as the likely outcome.',
                    order: 9
                }
            ],
            narrativeEdges: [
                {
                    id: 'origin-to-response',
                    fromPositionId: 'origin',
                    toPositionId: 'response',
                    relationship: 'informs'
                }
            ]
        }
    },
    correspondencesById: {
        ember: {
            id: 'ember',
            kind: 'element',
            name: 'Ember',
            attributes: {},
            sourceIds: ['invented-source']
        },
        lantern: {
            id: 'lantern',
            kind: 'suit',
            name: 'Lantern',
            attributes: {},
            sourceIds: ['invented-source']
        },
        two: {
            id: 'two',
            kind: 'number',
            name: 'Two',
            attributes: { value: 2 },
            sourceIds: ['invented-source']
        }
    },
    approvedThemeFragments: [
        {
            id: 'ember-theme-a',
            kind: 'correspondence-theme',
            subjects: [{ id: 'ember', type: 'element' }],
            theme: 'Warmth gathers around deliberate action.',
            when: { eq: [{ field: 'card.element' }, 'ember'] },
            polarity: 'reinforcing',
            status: 'approved',
            sourceIds: ['invented-source']
        },
        {
            id: 'lantern-theme-b',
            kind: 'correspondence-theme',
            subjects: [{ id: 'lantern', type: 'suit' }],
            theme: 'A visible signal makes the next step easier to choose.',
            when: { in: [{ field: 'card.suit' }, ['lantern']] },
            polarity: 'contextual',
            status: 'approved',
            sourceIds: ['invented-source']
        }
    ],
    relationshipRules: [
        {
            id: 'edge-rule',
            scope: 'named-pair',
            ruleType: 'named-position-edge',
            priority: 80,
            condition: {
                type: 'named-position-edge',
                edgeId: 'origin-to-response'
            },
            fact: 'The response develops directly from the origin.',
            sourceIds: ['invented-source']
        },
        {
            id: 'element-rule',
            scope: 'whole-spread',
            ruleType: 'element-dominance',
            priority: 70,
            condition: { type: 'dominance', subject: 'element', minimumCount: 2 },
            fact: 'A shared element gives the reading a consistent drive.',
            sourceIds: ['invented-source']
        },
        {
            id: 'suit-rule',
            scope: 'whole-spread',
            ruleType: 'suit-dominance',
            priority: 60,
            condition: { type: 'dominance', subject: 'suit', minimumCount: 2 },
            fact: 'A shared suit concentrates the reading.',
            sourceIds: ['invented-source']
        },
        {
            id: 'major-rule',
            scope: 'whole-spread',
            ruleType: 'major-arcana-weight',
            priority: 50,
            condition: { type: 'major-arcana-weight', minimumCount: 1 },
            fact: 'A major figure gives the spread extra weight.',
            sourceIds: ['invented-source']
        },
        {
            id: 'number-rule',
            scope: 'whole-spread',
            ruleType: 'number-repetition',
            priority: 40,
            condition: { type: 'number-repetition', minimumCount: 2 },
            fact: 'A repeated number links the selected cards.',
            sourceIds: ['invented-source']
        },
        {
            id: 'orientation-rule',
            scope: 'whole-spread',
            ruleType: 'orientation-balance',
            priority: 30,
            condition: {
                type: 'orientation-balance',
                orientation: 'upright',
                minimumCount: 2
            },
            fact: 'The orientation balance favors direct expression.',
            sourceIds: ['invented-source']
        }
    ],
    legacyPositionMeaningsByKey: {
        'celtic-cross:origin:dawn-keeper:upright': {
            id: 'origin-dawn-upright',
            spreadId: 'celtic-cross',
            positionId: 'origin',
            cardId: 'dawn-keeper',
            orientation: 'upright',
            meaning: 'A new possibility is already present.',
            sourceIds: ['invented-source'],
            status: 'approved'
        },
        'celtic-cross:response:tide-weaver:reversed': {
            id: 'response-tide-reversed',
            spreadId: 'celtic-cross',
            positionId: 'response',
            cardId: 'tide-weaver',
            orientation: 'reversed',
            meaning: 'Resistance slows the available response.',
            sourceIds: ['invented-source'],
            status: 'approved'
        }
    }
};

export const sanitizedComposerBundleV2 = {
    schemaVersion: 2,
    corpusVersion: SANITIZED_CORPUS_VERSION,
    cardsById: {
        'dawn-keeper': {
            id: 'dawn-keeper',
            index: 0,
            name: 'Dawn Keeper',
            title: 'The First Lantern',
            arcana: 'major',
            description: 'A traveler notices a new horizon.',
            number: 0,
            element: 'air',
            uprightKeywords: ['beginning', 'wonder'],
            uprightKeywordSourceIds: ['invented-source'],
            reversedKeywords: ['hesitation', 'delay'],
            reversedKeywordSourceIds: ['invented-source'],
            correspondenceIds: ['ember', 'lantern', 'two'],
            attributes: { path: 'opening' }
        },
        'tide-weaver': {
            id: 'tide-weaver',
            index: 1,
            name: 'Tide Weaver',
            title: 'The Patient Current',
            arcana: 'minor',
            description: 'A guide shapes a steady passage.',
            number: 2,
            suit: 'swords',
            element: 'air',
            uprightKeywords: ['patience', 'motion'],
            uprightKeywordSourceIds: ['invented-source'],
            reversedKeywords: ['stagnation', 'resistance'],
            reversedKeywordSourceIds: ['invented-source'],
            correspondenceIds: ['ember', 'lantern', 'two'],
            attributes: { path: 'continuance' }
        }
    },
    approvedSingleCardThemes: [
        {
            id: 'arcana-major-theme',
            dimension: 'arcana',
            value: 'major',
            theme: 'An invented broad-scale theme.',
            status: 'approved',
            sourceIds: ['invented-source']
        },
        {
            id: 'arcana-minor-theme',
            dimension: 'arcana',
            value: 'minor',
            theme: 'An invented daily-life theme.',
            status: 'approved',
            sourceIds: ['invented-source']
        },
        {
            id: 'suit-swords-theme',
            dimension: 'suit',
            value: 'swords',
            theme: 'An invented discernment theme.',
            status: 'approved',
            sourceIds: ['invented-source']
        },
        {
            id: 'number-zero-theme',
            dimension: 'number',
            value: 0,
            theme: 'An invented beginning theme.',
            status: 'approved',
            sourceIds: ['invented-source']
        },
        {
            id: 'number-two-theme',
            dimension: 'number',
            value: 2,
            theme: 'An invented relationship theme.',
            status: 'approved',
            sourceIds: ['invented-source']
        },
        {
            id: 'element-air-theme',
            dimension: 'element',
            value: 'air',
            theme: 'An invented motion theme.',
            status: 'approved',
            sourceIds: ['invented-source']
        }
    ],
    spreadsById: sanitizedComposerBundle.spreadsById,
    correspondencesById: sanitizedComposerBundle.correspondencesById,
    approvedThemeFragments: sanitizedComposerBundle.approvedThemeFragments.map(
        theme => ({
            ...theme,
            topicTags: ['invented-topic']
        })
    ),
    relationshipRules: sanitizedComposerBundle.relationshipRules,
    legacyPositionMeaningsByKey:
        sanitizedComposerBundle.legacyPositionMeaningsByKey
} as const;

export const sanitizedSingleCardRequest: ReadingRequest = {
    spread: 'single_card',
    items: [
        {
            cardIndex: 0,
            cardName: 'Dawn Keeper',
            position: 'guidance',
            reversed: false
        }
    ]
};

export const sanitizedCelticCrossRequest: ReadingRequest = {
    spread: 'celtic_cross',
    items: [
        {
            cardIndex: 0,
            cardName: 'Dawn Keeper',
            position: 'origin',
            reversed: false
        },
        {
            cardIndex: 1,
            cardName: 'Tide Weaver',
            position: 'response',
            reversed: true
        },
        {
            cardIndex: 0,
            cardName: 'Dawn Keeper',
            position: 'foundation',
            reversed: false
        },
        {
            cardIndex: 1,
            cardName: 'Tide Weaver',
            position: 'recent',
            reversed: false
        },
        {
            cardIndex: 0,
            cardName: 'Dawn Keeper',
            position: 'aim',
            reversed: true
        },
        {
            cardIndex: 1,
            cardName: 'Tide Weaver',
            position: 'near',
            reversed: false
        },
        {
            cardIndex: 0,
            cardName: 'Dawn Keeper',
            position: 'self',
            reversed: false
        },
        {
            cardIndex: 1,
            cardName: 'Tide Weaver',
            position: 'setting',
            reversed: true
        },
        {
            cardIndex: 0,
            cardName: 'Dawn Keeper',
            position: 'hope',
            reversed: false
        },
        {
            cardIndex: 1,
            cardName: 'Tide Weaver',
            position: 'outcome',
            reversed: false
        }
    ]
};
