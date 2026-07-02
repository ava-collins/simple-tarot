import { describe, expect, it } from 'vitest';
import { handler } from './lambda';

describe('lambda handler', () => {
    it('exports a callable API Gateway Lambda handler', () => {
        expect(typeof handler).toBe('function');
    });
});
