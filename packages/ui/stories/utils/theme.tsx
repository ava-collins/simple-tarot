import colors from './colors';

interface ThemeColors {
    background: string;
    primary: string;
    secondary: string;
    base: string;
    white: string;
    black: string;
    grey0: string;
    grey1: string;
    grey2: string;
    grey3: string;
    grey4: string;
    grey5: string;
    greyOutline: string;
    searchBg: string;
    success: string;
    warning: string;
    error: string;
}

interface Theme {
    colors: ThemeColors;
    formWrapperStyle: object;
}

const fallbackColor = '#ff0000';

const themeColors: ThemeColors = {
    background: colors.spanish_gray?.base ?? fallbackColor,
    primary: colors.smoky_black?.base ?? fallbackColor,
    secondary: colors.tuscany?.dark ?? fallbackColor,
    base: colors.cambridge_blue?.base ?? fallbackColor,
    white: colors.silver_sand?.accent1 ?? fallbackColor,
    black: colors.smoky_black?.base ?? fallbackColor,
    grey0: colors.silver_sand?.light ?? fallbackColor,
    grey1: colors.silver_sand?.base ?? fallbackColor,
    grey2: colors.silver_sand?.muted ?? fallbackColor,
    grey3: colors.spanish_gray?.muted ?? fallbackColor,
    grey4: colors.spanish_gray?.shadow ?? fallbackColor,
    grey5: colors.spanish_gray?.dark ?? fallbackColor,
    greyOutline: colors.silver_sand?.muted ?? fallbackColor,
    searchBg: colors.spanish_gray?.light ?? fallbackColor,
    success: colors.medium_aquamarine?.base ?? fallbackColor,
    warning: colors.lemon?.base ?? fallbackColor,
    error: colors.electric_orange?.base ?? fallbackColor
};

const theme = (tc = themeColors): Theme => ({
    colors: themeColors,
    formWrapperStyle: {
        width: '100%',
        paddingHorizontal: 80,
        backgroundColor: tc.grey0,
        alignItems: 'stretch'
    }
});

export default theme(themeColors);
