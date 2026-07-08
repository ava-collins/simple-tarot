import { describe, expect, it } from 'vitest';

import * as ClientHooks from './client';
import * as RootHooks from './index';
import * as ServerHooks from './server';

describe('hooks package entrypoints', () => {
    it('keeps the server entrypoint free of client React hooks', () => {
        expect(ServerHooks).toHaveProperty('createTarotApiClient');
        expect(ServerHooks).toHaveProperty('createAvatarApiClient');
        expect(ServerHooks).toHaveProperty('createOneCardReadingRequest');
        expect(ServerHooks).toHaveProperty('createReadingHistoryResource');
        expect(ServerHooks).toHaveProperty('createAvatarThumbnailsResource');
        expect(ServerHooks).not.toHaveProperty('useRscReadingHistory');
        expect(ServerHooks).not.toHaveProperty('useRscAvatarImage');
        expect(ServerHooks).not.toHaveProperty('useLoginForm');
    });

    it('exposes client hooks from the client entrypoint', () => {
        expect(ClientHooks).toHaveProperty('useRscReadingHistory');
        expect(ClientHooks).toHaveProperty('useRscAvatarImage');
        expect(ClientHooks).toHaveProperty('useLoginForm');
        expect(ClientHooks).toHaveProperty('useForgotPasswordForm');
    });

    it('keeps the root barrel server-safe during migration', () => {
        expect(RootHooks).toHaveProperty('createTarotApiClient');
        expect(RootHooks).toHaveProperty('createAvatarApiClient');
        expect(RootHooks).not.toHaveProperty('useRscReadingHistory');
        expect(RootHooks).not.toHaveProperty('useRscAvatarImage');
        expect(RootHooks).not.toHaveProperty('useAvatarImage');
    });
});
