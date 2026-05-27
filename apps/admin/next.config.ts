import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
    reactStrictMode: true,
    transpilePackages: [
        '@rneui/base',
        '@rneui/themed',
        '@simpletarot/ui',
        'react-native',
        'react-native-elements',
        'react-native-web'
    ],
    webpack: (config) => {
        config.resolve.alias = {
            ...(config.resolve.alias || {}),
            'react-native$': 'react-native-web'
        };
        config.resolve.extensions = [
            '.web.js',
            '.web.jsx',
            '.web.ts',
            '.web.tsx',
            ...config.resolve.extensions
        ];

        return config;
    }
};

export default nextConfig;
