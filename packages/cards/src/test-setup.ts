import { vi } from 'vitest';

vi.mock('react-native-svg', async () => {
    const mockSvgComponent = (name: string) =>
        vi.fn().mockImplementation(({ children, ...props }) => ({
            type: name,
            props: { ...props, children },
            key: null,
            ref: null
        }));

    return {
        default: mockSvgComponent('Svg'),
        Svg: mockSvgComponent('Svg'),
        Circle: mockSvgComponent('Circle'),
        Ellipse: mockSvgComponent('Ellipse'),
        G: mockSvgComponent('G'),
        Text: mockSvgComponent('Text'),
        TSpan: mockSvgComponent('TSpan'),
        TextPath: mockSvgComponent('TextPath'),
        Path: mockSvgComponent('Path'),
        Polygon: mockSvgComponent('Polygon'),
        Polyline: mockSvgComponent('Polyline'),
        Line: mockSvgComponent('Line'),
        Rect: mockSvgComponent('Rect'),
        Use: mockSvgComponent('Use'),
        Image: mockSvgComponent('Image'),
        Symbol: mockSvgComponent('Symbol'),
        Defs: mockSvgComponent('Defs'),
        LinearGradient: mockSvgComponent('LinearGradient'),
        RadialGradient: mockSvgComponent('RadialGradient'),
        Stop: mockSvgComponent('Stop'),
        ClipPath: mockSvgComponent('ClipPath'),
        Pattern: mockSvgComponent('Pattern'),
        Mask: mockSvgComponent('Mask'),
        Marker: mockSvgComponent('Marker'),
        ForeignObject: mockSvgComponent('ForeignObject')
    };
});
