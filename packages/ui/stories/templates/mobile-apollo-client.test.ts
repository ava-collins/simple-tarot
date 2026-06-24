import { HttpLink } from '@apollo/client';
import { describe, expect, it } from 'vitest';

import { createMobileApolloClient } from './mobile-apollo-client';

describe('createMobileApolloClient', () => {
    it('uses an explicit HttpLink for Apollo 3.14 clients', () => {
        const client = createMobileApolloClient('https://example.com/graphql');

        expect(client.link).toBeInstanceOf(HttpLink);
    });
});
