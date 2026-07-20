import type { Request, Response } from 'express';

export const authenticatedUserIdFor = (res: Response): string | undefined =>
    typeof res.locals.authenticatedUser?.userId === 'string'
        ? res.locals.authenticatedUser.userId
        : undefined;

export const cognitoIssuerFor = (res: Response): string | undefined =>
    typeof res.locals.authenticatedUser?.claims?.iss === 'string'
        ? res.locals.authenticatedUser.claims.iss
        : undefined;

const sourceIpFor = (req: Request): string => {
    const forwardedFor = req.header('x-forwarded-for');

    if (forwardedFor) {
        return forwardedFor.split(',')[0]?.trim() ?? '';
    }

    return req.ip ?? '';
};

export const readingLogEventBaseFor = (
    req: Request,
    res: Response,
    timestamp: string,
    startedAtMs: number,
    statusCode: number
) => ({
    cognitoSub: authenticatedUserIdFor(res),
    durationMs: Math.max(0, Date.parse(timestamp) - startedAtMs),
    hasQuestion: typeof req.body?.question === 'string' && req.body.question.length > 0,
    method: req.method,
    requestId: res.locals.requestId,
    route: req.originalUrl,
    sourceIp: sourceIpFor(req),
    statusCode,
    timestamp,
    userAgent: req.header('user-agent')
});
