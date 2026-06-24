import { ApolloProvider } from '@apollo/client';

import React, { useMemo } from 'react';
import { createMobileApolloClient, defaultGraphUri } from './mobile-apollo-client';
import { typePolicies } from '@simpletarot/hooks';

const MobileProviders: React.FC<{ env: Record<string, string | undefined>; children: React.ReactNode }> = ({
    env,
    children
}) => {
    const graphUri = env.GRAPH_URI || defaultGraphUri;
    const client = useMemo(
        () => createMobileApolloClient(graphUri, typePolicies),
        [graphUri]
    );

    return <ApolloProvider client={client}>{children}</ApolloProvider>;
};

export default MobileProviders;

export interface MobileProvidersProps {
    env: Record<string, string | undefined>;
    children: React.ReactNode;
}
