export type ApiConfig = {
    hostname: string;
    port: number;
};

const parsePort = (value: string | undefined): number => {
    if (value === undefined || value.length === 0) {
        return 4100;
    }

    const port = Number.parseInt(value, 10);
    if (!Number.isInteger(port) || port <= 0) {
        throw new Error(`Invalid PORT value "${value}".`);
    }

    return port;
};

export function getApiConfig(env = process.env): ApiConfig {
    return {
        hostname: env.HOST ?? 'localhost',
        port: parsePort(env.PORT)
    };
}
