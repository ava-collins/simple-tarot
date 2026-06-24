import { ApolloClient, HttpLink, InMemoryCache } from '@apollo/client';
import type { InMemoryCacheConfig } from '@apollo/client';

export const defaultGraphUri = 'http://localhost:4000/graphql';

export function createMobileApolloClient(
    uri = defaultGraphUri,
    cacheConfig?: InMemoryCacheConfig
) {
    return new ApolloClient({
        link: new HttpLink({ uri }),
        cache: new InMemoryCache(cacheConfig)
    });
}
