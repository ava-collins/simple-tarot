import { ApolloClient, ApolloProvider, InMemoryCache } from '@apollo/client';

import React from 'react';
import { typePolicies } from '@simpletarot/hooks';

const MobileProviders: React.FC<{ env: Record<string, string | undefined>; children: React.ReactNode }> = ({
    env,
    children
}) => {
    const client = new ApolloClient({
        uri: env.GRAPH_URI || 'http://localhost:4000/graphql',
        cache: new InMemoryCache(typePolicies)
    });

    return <ApolloProvider client={client}>{children}</ApolloProvider>;
};

export default MobileProviders;

export interface MobileProvidersProps {
    env: Record<string, string | undefined>;
    children: React.ReactNode;
}
