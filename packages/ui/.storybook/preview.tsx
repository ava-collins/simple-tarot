import { ApolloClient, ApolloProvider, InMemoryCache } from '@apollo/client';
import { initialize, mswLoader } from 'msw-storybook-addon';

import { INITIAL_VIEWPORTS } from 'storybook/viewport';
import type { Preview } from '@storybook/react-native-web-vite';
import React from 'react';
import { typePolicies } from '@simpletarot/hooks';

let options = {};
if (location.hostname === 'ava-collins.github.io') {
    options = {
        serviceWorker: {
            url: '/simple-tarot/mockServiceWorker.js'
        },
        onUnhandledRequest: 'bypass'
    };
}

initialize(options);
/*
 * Initializes MSW
 * See https://github.com/mswjs/msw-storybook-addon#configuring-msw
 * to learn how to customize it
 */

const preview: Preview = {
    decorators: [
        (Story: React.FC) => {
            const mockClient = new ApolloClient({
                uri: '/graphql',
                cache: new InMemoryCache(typePolicies),
                connectToDevTools: true
            });
            return (
                <ApolloProvider client={mockClient}>
                    <Story />
                </ApolloProvider>
            );
        }
    ],
    parameters: {
        viewport: {
            options: INITIAL_VIEWPORTS
        },
        controls: {
            matchers: {
                color: /(background|color)$/i,
                date: /Date$/i
            }
        }
    },
    globalTypes: {},
    tags: ['autodocs'],
    loaders: [mswLoader]
};

export default preview;
