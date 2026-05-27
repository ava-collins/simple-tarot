import { dirname, join } from 'path';

import type { StorybookConfig } from '@storybook/react-native-web-vite';
import { createRequire } from 'module';

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
            modulesToTranspile: [
                'react-native-reanimated',
                'react-native-worklets',
                '@simpletarot/hooks'
            ],
            pluginReactOptions: {
                babel: {
                    plugins: [
                        '@babel/plugin-proposal-export-namespace-from',
                        [
                            'react-native-reanimated/plugin',
                            {
                                disableSourceMaps: true
                            }
                        ]
                    ]
                }
            }
        }
    },
    viteFinal: async config => {
        const { mergeConfig } = await import('vite');

        return mergeConfig(config, {
            optimizeDeps: {
                exclude: ['react-native-reanimated', 'react-native-worklets']
            },
            resolve: {
                alias: {
                    'react-native$': 'react-native-web'
                }
            }
        });
    },
    staticDirs: ['../public']
};

export default config;
