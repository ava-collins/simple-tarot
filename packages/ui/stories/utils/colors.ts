interface Color {
    base: string;
    muted?: string;
    dark?: string;
    light?: string;
    shadow?: string;
    highlight?: string;
    accent1?: string;
    accent2?: string;
    accent3?: string;
    accent4?: string;
    rgba?: {
        base: string;
    };
}

const electric_orange: Color = {
    base: '#ff3305',
    muted: '#E62E05',
    accent1: '#FFEB1F',
    accent2: '#4E12FF'
};

const medium_aquamarine: Color = {
    base: '#74D497'
};

const lemon: Color = {
    base: '#FFF36B'
};

const tuscany: Color = {
    base: '#BA9F9E',
    light: '#C7AAA9',
    muted: '#A18989',
    shadow: '#7A6968',
    dark: '#3B3232',
    accent1: '#FFF3F2',
    accent2: '#95BAB7'
};

const cambridge_blue: Color = {
    base: '#9FBAA9',
    muted: '#89A191',
    shadow: '#687A6F',
    dark: '#323B35',
    highlight: '#A9C7B4',
    accent1: '#F2FFF7',
    accent2: tuscany.base
};

const spanish_gray: Color = {
    base: '#929396',
    light: '#DCDEE3',
    muted: '#9EA0A3',
    shadow: '#797A7D',
    dark: '#545557',
    accent1: '#E3E3E3',
    accent2: '#879396',
    rgba: {
        base: 'rgba(146, 147, 150, 1)'
    }
};

const silver_sand: Color = {
    base: '#c3c4c7',
    light: '#CFD0D4',
    muted: '#AAABAD',
    shadow: '#848587',
    dark: '#464647',
    accent1: '#FFFFFF',
    accent2: '#C7C5AF'
};

const spanish_white: Color = {
    base: '#E3E1C5',
    light: '#F0EED1',
    muted: '#C9C8AF',
    shadow: '#A3A28E',
    dark: '#636357',
    accent1: '#FFFEF7',
    accent2: '#E3C3BA'
};

const smoky_black: Color = {
    base: '#0F100E',
    accent1: '#2B2033',
    accent2: '#383342',
    accent3: '#334235',
    accent4: '#377541'
};

type Colors = {
    [key: string]: Color;
};
const colors: Colors = {
    cambridge_blue,
    electric_orange,
    lemon,
    medium_aquamarine,
    silver_sand,
    smoky_black,
    spanish_gray,
    spanish_white,
    tuscany
};

function getColor(name: string): Color | undefined {
    return colors[name];
}

export default colors;
