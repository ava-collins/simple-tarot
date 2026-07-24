const { withInfoPlist } = require('expo/config-plugins');

// react-native-vector-icons' CocoaPod already bundles every font file in
// Fonts/*.ttf as a pod resource (RNVectorIcons.podspec: `s.resources =
// "Fonts/*.ttf"`), so the physical .ttf files are already copied into the
// app bundle by CocoaPods. iOS just never learns they exist, because
// nothing registers them in Info.plist's UIAppFonts. Registering them via
// expo-font's `fonts` plugin option would additionally add them as Xcode
// project resources, duplicating what the pod already provides and
// breaking the build ("Multiple commands produce ...ttf"). This plugin
// only touches Info.plist.
const VECTOR_ICON_FONTS = ['MaterialIcons.ttf', 'MaterialCommunityIcons.ttf'];

module.exports = function withVectorIconFonts(config) {
    return withInfoPlist(config, config => {
        const existingFonts = Array.isArray(config.modResults.UIAppFonts)
            ? config.modResults.UIAppFonts
            : [];

        config.modResults.UIAppFonts = Array.from(
            new Set([...existingFonts, ...VECTOR_ICON_FONTS])
        );

        return config;
    });
};
