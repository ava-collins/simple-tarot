import { GraphQLResolveInfo } from 'graphql';
import { DataSourceContext } from './context';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
export type RequireFields<T, K extends keyof T> = Omit<T, K> & { [P in K]-?: NonNullable<T[P]> };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
};

export type AvatarImage = {
  __typename?: 'AvatarImage';
  thumbnail: Scalars['String']['output'];
};

export type Card = {
  __typename?: 'Card';
  description: Scalars['String']['output'];
  image: Scalars['String']['output'];
  index: Scalars['Int']['output'];
  keywords: Scalars['String']['output'];
  meanings: Array<CardPositionMeaning>;
  name: Scalars['String']['output'];
  numeral: Scalars['String']['output'];
  reversedKeywords: Scalars['String']['output'];
  title: Scalars['String']['output'];
  type: Scalars['String']['output'];
};

export type CardInput = {
  description: Scalars['String']['input'];
  image: Scalars['String']['input'];
  index: Scalars['Int']['input'];
  keywords: Scalars['String']['input'];
  name: Scalars['String']['input'];
  numeral: Scalars['String']['input'];
  reversedKeywords: Scalars['String']['input'];
  title: Scalars['String']['input'];
  type: Scalars['String']['input'];
};

export type CardPositionMeaning = {
  __typename?: 'CardPositionMeaning';
  card: Array<Card>;
  meaning: Scalars['String']['output'];
  position: Array<SpreadPosition>;
  reversed: Array<Reversed>;
  upright: Array<Upright>;
};


export type CardPositionMeaningMeaningArgs = {
  isReversed: Scalars['Boolean']['input'];
};

export type CardPositionMeaningInput = {
  cardIndex: Scalars['Int']['input'];
  reversedMeaning: Scalars['String']['input'];
  spreadPositionIndex: Scalars['Int']['input'];
  uprightMeaning: Scalars['String']['input'];
};

export type Mutation = {
  __typename?: 'Mutation';
  addSpread: Spread;
  createCard: Card;
  createCardPositionMeaning: CardPositionMeaning;
  createCardPositionMeanings: Array<CardPositionMeaning>;
  createCards: Array<Card>;
  createReversed: Reversed;
  createSpread: Spread;
  createSpreadPosition: SpreadPosition;
  createSuite: Suite;
  createUpright: Upright;
};


export type MutationAddSpreadArgs = {
  spread: SpreadInput;
};


export type MutationCreateCardArgs = {
  input: CardInput;
};


export type MutationCreateCardPositionMeaningArgs = {
  input: CardPositionMeaningInput;
};


export type MutationCreateCardPositionMeaningsArgs = {
  inputs: Array<CardPositionMeaningInput>;
};


export type MutationCreateCardsArgs = {
  cards: Array<CardInput>;
};


export type MutationCreateReversedArgs = {
  input: ReversedInput;
};


export type MutationCreateSpreadArgs = {
  input: SpreadMutationInput;
};


export type MutationCreateSpreadPositionArgs = {
  input: SpreadPositionInput;
};


export type MutationCreateSuiteArgs = {
  input: SuiteInput;
};


export type MutationCreateUprightArgs = {
  input: UprightInput;
};

export type Query = {
  __typename?: 'Query';
  avatarImages: Array<AvatarImage>;
  cardsByIndex: Array<Card>;
  reading: Array<SpreadCard>;
};


export type QueryCardsByIndexArgs = {
  indexes: Array<Scalars['Int']['input']>;
};


export type QueryReadingArgs = {
  items: Array<ReadingItemInput>;
};

export type ReadingItemInput = {
  cardIndex: Scalars['Int']['input'];
  reversed: Scalars['Boolean']['input'];
  spreadPositionIndex: Scalars['Int']['input'];
};

export type Reversed = {
  __typename?: 'Reversed';
  meaning: Scalars['String']['output'];
};

export type ReversedInput = {
  meaning: Scalars['String']['input'];
};

export type Spread = {
  __typename?: 'Spread';
  description: Scalars['String']['output'];
  displayName: Scalars['String']['output'];
  name: Scalars['String']['output'];
  positions: Array<SpreadPosition>;
};

export type SpreadCard = {
  __typename?: 'SpreadCard';
  card: Card;
  cardReading: Scalars['String']['output'];
  keywords: Array<Scalars['String']['output']>;
  position: SpreadPosition;
  reversed: Scalars['Boolean']['output'];
};

export type SpreadInput = {
  description: Scalars['String']['input'];
  displayName: Scalars['String']['input'];
  name: Scalars['String']['input'];
  positions: Array<Scalars['ID']['input']>;
};

export type SpreadMutationInput = {
  description: Scalars['String']['input'];
  displayName: Scalars['String']['input'];
  name: Scalars['String']['input'];
  spreadPositionIndexes: Array<Scalars['Int']['input']>;
};

export type SpreadPosition = {
  __typename?: 'SpreadPosition';
  description: Scalars['String']['output'];
  displayName: Scalars['String']['output'];
  index: Scalars['Int']['output'];
  meanings: Array<CardPositionMeaning>;
  spreadName: Scalars['String']['output'];
};

export type SpreadPositionInput = {
  description: Scalars['String']['input'];
  displayName: Scalars['String']['input'];
  index: Scalars['Int']['input'];
  spreadName: Scalars['String']['input'];
};

export type Suite = {
  __typename?: 'Suite';
  dominion?: Maybe<Scalars['String']['output']>;
  element: Scalars['String']['output'];
  name: Scalars['String']['output'];
  zodiac: Array<Scalars['String']['output']>;
};

export type SuiteInput = {
  dominion?: InputMaybe<Scalars['String']['input']>;
  element: Scalars['String']['input'];
  name: Scalars['String']['input'];
  zodiac: Array<Scalars['String']['input']>;
};

export type Upright = {
  __typename?: 'Upright';
  meaning: Scalars['String']['output'];
};

export type UprightInput = {
  meaning: Scalars['String']['input'];
};



export type ResolverTypeWrapper<T> = Promise<T> | T;


export type ResolverWithResolve<TResult, TParent, TContext, TArgs> = {
  resolve: ResolverFn<TResult, TParent, TContext, TArgs>;
};
export type Resolver<TResult, TParent = {}, TContext = {}, TArgs = {}> = ResolverFn<TResult, TParent, TContext, TArgs> | ResolverWithResolve<TResult, TParent, TContext, TArgs>;

export type ResolverFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => Promise<TResult> | TResult;

export type SubscriptionSubscribeFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => AsyncIterable<TResult> | Promise<AsyncIterable<TResult>>;

export type SubscriptionResolveFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => TResult | Promise<TResult>;

export interface SubscriptionSubscriberObject<TResult, TKey extends string, TParent, TContext, TArgs> {
  subscribe: SubscriptionSubscribeFn<{ [key in TKey]: TResult }, TParent, TContext, TArgs>;
  resolve?: SubscriptionResolveFn<TResult, { [key in TKey]: TResult }, TContext, TArgs>;
}

export interface SubscriptionResolverObject<TResult, TParent, TContext, TArgs> {
  subscribe: SubscriptionSubscribeFn<any, TParent, TContext, TArgs>;
  resolve: SubscriptionResolveFn<TResult, any, TContext, TArgs>;
}

export type SubscriptionObject<TResult, TKey extends string, TParent, TContext, TArgs> =
  | SubscriptionSubscriberObject<TResult, TKey, TParent, TContext, TArgs>
  | SubscriptionResolverObject<TResult, TParent, TContext, TArgs>;

export type SubscriptionResolver<TResult, TKey extends string, TParent = {}, TContext = {}, TArgs = {}> =
  | ((...args: any[]) => SubscriptionObject<TResult, TKey, TParent, TContext, TArgs>)
  | SubscriptionObject<TResult, TKey, TParent, TContext, TArgs>;

export type TypeResolveFn<TTypes, TParent = {}, TContext = {}> = (
  parent: TParent,
  context: TContext,
  info: GraphQLResolveInfo
) => Maybe<TTypes> | Promise<Maybe<TTypes>>;

export type IsTypeOfResolverFn<T = {}, TContext = {}> = (obj: T, context: TContext, info: GraphQLResolveInfo) => boolean | Promise<boolean>;

export type NextResolverFn<T> = () => Promise<T>;

export type DirectiveResolverFn<TResult = {}, TParent = {}, TContext = {}, TArgs = {}> = (
  next: NextResolverFn<TResult>,
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => TResult | Promise<TResult>;



/** Mapping between all available schema types and the resolvers types */
export type ResolversTypes = {
  AvatarImage: ResolverTypeWrapper<AvatarImage>;
  Boolean: ResolverTypeWrapper<Scalars['Boolean']['output']>;
  Card: ResolverTypeWrapper<Card>;
  CardInput: CardInput;
  CardPositionMeaning: ResolverTypeWrapper<CardPositionMeaning>;
  CardPositionMeaningInput: CardPositionMeaningInput;
  ID: ResolverTypeWrapper<Scalars['ID']['output']>;
  Int: ResolverTypeWrapper<Scalars['Int']['output']>;
  Mutation: ResolverTypeWrapper<{}>;
  Query: ResolverTypeWrapper<{}>;
  ReadingItemInput: ReadingItemInput;
  Reversed: ResolverTypeWrapper<Reversed>;
  ReversedInput: ReversedInput;
  Spread: ResolverTypeWrapper<Spread>;
  SpreadCard: ResolverTypeWrapper<SpreadCard>;
  SpreadInput: SpreadInput;
  SpreadMutationInput: SpreadMutationInput;
  SpreadPosition: ResolverTypeWrapper<SpreadPosition>;
  SpreadPositionInput: SpreadPositionInput;
  String: ResolverTypeWrapper<Scalars['String']['output']>;
  Suite: ResolverTypeWrapper<Suite>;
  SuiteInput: SuiteInput;
  Upright: ResolverTypeWrapper<Upright>;
  UprightInput: UprightInput;
};

/** Mapping between all available schema types and the resolvers parents */
export type ResolversParentTypes = {
  AvatarImage: AvatarImage;
  Boolean: Scalars['Boolean']['output'];
  Card: Card;
  CardInput: CardInput;
  CardPositionMeaning: CardPositionMeaning;
  CardPositionMeaningInput: CardPositionMeaningInput;
  ID: Scalars['ID']['output'];
  Int: Scalars['Int']['output'];
  Mutation: {};
  Query: {};
  ReadingItemInput: ReadingItemInput;
  Reversed: Reversed;
  ReversedInput: ReversedInput;
  Spread: Spread;
  SpreadCard: SpreadCard;
  SpreadInput: SpreadInput;
  SpreadMutationInput: SpreadMutationInput;
  SpreadPosition: SpreadPosition;
  SpreadPositionInput: SpreadPositionInput;
  String: Scalars['String']['output'];
  Suite: Suite;
  SuiteInput: SuiteInput;
  Upright: Upright;
  UprightInput: UprightInput;
};

export type AvatarImageResolvers<ContextType = DataSourceContext, ParentType extends ResolversParentTypes['AvatarImage'] = ResolversParentTypes['AvatarImage']> = {
  thumbnail?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type CardResolvers<ContextType = DataSourceContext, ParentType extends ResolversParentTypes['Card'] = ResolversParentTypes['Card']> = {
  description?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  image?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  index?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  keywords?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  meanings?: Resolver<Array<ResolversTypes['CardPositionMeaning']>, ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  numeral?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  reversedKeywords?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  title?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  type?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type CardPositionMeaningResolvers<ContextType = DataSourceContext, ParentType extends ResolversParentTypes['CardPositionMeaning'] = ResolversParentTypes['CardPositionMeaning']> = {
  card?: Resolver<Array<ResolversTypes['Card']>, ParentType, ContextType>;
  meaning?: Resolver<ResolversTypes['String'], ParentType, ContextType, RequireFields<CardPositionMeaningMeaningArgs, 'isReversed'>>;
  position?: Resolver<Array<ResolversTypes['SpreadPosition']>, ParentType, ContextType>;
  reversed?: Resolver<Array<ResolversTypes['Reversed']>, ParentType, ContextType>;
  upright?: Resolver<Array<ResolversTypes['Upright']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type MutationResolvers<ContextType = DataSourceContext, ParentType extends ResolversParentTypes['Mutation'] = ResolversParentTypes['Mutation']> = {
  addSpread?: Resolver<ResolversTypes['Spread'], ParentType, ContextType, RequireFields<MutationAddSpreadArgs, 'spread'>>;
  createCard?: Resolver<ResolversTypes['Card'], ParentType, ContextType, RequireFields<MutationCreateCardArgs, 'input'>>;
  createCardPositionMeaning?: Resolver<ResolversTypes['CardPositionMeaning'], ParentType, ContextType, RequireFields<MutationCreateCardPositionMeaningArgs, 'input'>>;
  createCardPositionMeanings?: Resolver<Array<ResolversTypes['CardPositionMeaning']>, ParentType, ContextType, RequireFields<MutationCreateCardPositionMeaningsArgs, 'inputs'>>;
  createCards?: Resolver<Array<ResolversTypes['Card']>, ParentType, ContextType, RequireFields<MutationCreateCardsArgs, 'cards'>>;
  createReversed?: Resolver<ResolversTypes['Reversed'], ParentType, ContextType, RequireFields<MutationCreateReversedArgs, 'input'>>;
  createSpread?: Resolver<ResolversTypes['Spread'], ParentType, ContextType, RequireFields<MutationCreateSpreadArgs, 'input'>>;
  createSpreadPosition?: Resolver<ResolversTypes['SpreadPosition'], ParentType, ContextType, RequireFields<MutationCreateSpreadPositionArgs, 'input'>>;
  createSuite?: Resolver<ResolversTypes['Suite'], ParentType, ContextType, RequireFields<MutationCreateSuiteArgs, 'input'>>;
  createUpright?: Resolver<ResolversTypes['Upright'], ParentType, ContextType, RequireFields<MutationCreateUprightArgs, 'input'>>;
};

export type QueryResolvers<ContextType = DataSourceContext, ParentType extends ResolversParentTypes['Query'] = ResolversParentTypes['Query']> = {
  avatarImages?: Resolver<Array<ResolversTypes['AvatarImage']>, ParentType, ContextType>;
  cardsByIndex?: Resolver<Array<ResolversTypes['Card']>, ParentType, ContextType, RequireFields<QueryCardsByIndexArgs, 'indexes'>>;
  reading?: Resolver<Array<ResolversTypes['SpreadCard']>, ParentType, ContextType, RequireFields<QueryReadingArgs, 'items'>>;
};

export type ReversedResolvers<ContextType = DataSourceContext, ParentType extends ResolversParentTypes['Reversed'] = ResolversParentTypes['Reversed']> = {
  meaning?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type SpreadResolvers<ContextType = DataSourceContext, ParentType extends ResolversParentTypes['Spread'] = ResolversParentTypes['Spread']> = {
  description?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  displayName?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  positions?: Resolver<Array<ResolversTypes['SpreadPosition']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type SpreadCardResolvers<ContextType = DataSourceContext, ParentType extends ResolversParentTypes['SpreadCard'] = ResolversParentTypes['SpreadCard']> = {
  card?: Resolver<ResolversTypes['Card'], ParentType, ContextType>;
  cardReading?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  keywords?: Resolver<Array<ResolversTypes['String']>, ParentType, ContextType>;
  position?: Resolver<ResolversTypes['SpreadPosition'], ParentType, ContextType>;
  reversed?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type SpreadPositionResolvers<ContextType = DataSourceContext, ParentType extends ResolversParentTypes['SpreadPosition'] = ResolversParentTypes['SpreadPosition']> = {
  description?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  displayName?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  index?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  meanings?: Resolver<Array<ResolversTypes['CardPositionMeaning']>, ParentType, ContextType>;
  spreadName?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type SuiteResolvers<ContextType = DataSourceContext, ParentType extends ResolversParentTypes['Suite'] = ResolversParentTypes['Suite']> = {
  dominion?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  element?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  zodiac?: Resolver<Array<ResolversTypes['String']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type UprightResolvers<ContextType = DataSourceContext, ParentType extends ResolversParentTypes['Upright'] = ResolversParentTypes['Upright']> = {
  meaning?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type Resolvers<ContextType = DataSourceContext> = {
  AvatarImage?: AvatarImageResolvers<ContextType>;
  Card?: CardResolvers<ContextType>;
  CardPositionMeaning?: CardPositionMeaningResolvers<ContextType>;
  Mutation?: MutationResolvers<ContextType>;
  Query?: QueryResolvers<ContextType>;
  Reversed?: ReversedResolvers<ContextType>;
  Spread?: SpreadResolvers<ContextType>;
  SpreadCard?: SpreadCardResolvers<ContextType>;
  SpreadPosition?: SpreadPositionResolvers<ContextType>;
  Suite?: SuiteResolvers<ContextType>;
  Upright?: UprightResolvers<ContextType>;
};

