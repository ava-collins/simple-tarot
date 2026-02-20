import { dirname, join } from 'path';
import { createRequire } from 'module';

import type { StorybookConfig } from '@storybook/react-native-web-vite';

const require = createRequire(import.meta.url);

/**
 * This function is used to resolve the absolute path of a package.
 * It is needed in projects that use Yarn PnP or are set up within a monorepo.
 */
function getAbsolutePath(value: string): any {
    return dirname(require.resolve(join(value, 'package.json')));
}
const config: StorybookConfig = {
    stories: ['../stories/**/*.stories.@(js|jsx|mjs|ts|tsx)'],
    addons: ['@storybook/addon-docs'],
    framework: {
        name: getAbsolutePath('@storybook/react-native-web-vite'),
        options: {
            pluginReactOptions: {
                babel: {
                    plugins: [
                        '@babel/plugin-proposal-export-namespace-from',
                        'react-native-reanimated/plugin'
                    ]
                }
            }
        }
    },
    staticDirs: ['../public']
};
export default config;
