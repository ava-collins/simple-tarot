import { initialize, mswLoader } from 'msw-storybook-addon';

import { INITIAL_VIEWPORTS } from 'storybook/viewport';
import type { Preview } from '@storybook/react-native-web-vite';

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

const preview: Preview = {
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
