import { vi } from 'vitest';

vi.mock('react-native', () => ({
    Platform: {
        OS: 'web',
        select: vi.fn(obj => obj.web || obj.default)
    },
    StyleSheet: {
        create: vi.fn(styles => styles)
    }
}));
