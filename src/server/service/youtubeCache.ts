import { Redis } from "@upstash/redis";
import NodeCache from "node-cache";

const CACHE_KEYS = ["YTDATA_EXPLORE_CONTENTS", "YTDATA_EXPLORE_RICHCONTENTS_SHORTS", "YTDATA_EXPLORE_RICHCONTENTS_TRENDING", "YTDATA_EXPLORE_RICHCONTENTS_OTHERS"];

export class YoutubeCacheService {
    private redis: Redis;
    private nodeCache: NodeCache;

    constructor() {
        this.redis = new Redis({
            url:
                process.env.UPSTASH_REDIS_REST_URL ??
                (() => {
                    throw new Error("UPSTASH_REDIS_REST_URL is not set");
                })(),
            token:
                process.env.UPSTASH_REDIS_REST_TOKEN ??
                (() => {
                    throw new Error("UPSTASH_REDIS_REST_TOKEN is not set");
                })()
        });
        this.nodeCache = new NodeCache();
    }

    /**
     * Collate YouTube data from Upstash Redis and NodeCache.
     * Priority: Upstash Redis > NodeCache
     * Returns an object with all cache keys and their values.
     */
    public async collateYoutubeCache(): Promise<Record<string, unknown>> {
        const result: Record<string, unknown> = {};

        for (const key of CACHE_KEYS) {
            // Try Upstash Redis first
            const value = await this.redis.get(key);
            if (value !== null && value !== undefined) {
                try {
                    result[key] = typeof value === "string" ? (JSON.parse(value) as unknown) : (value as unknown);
                    continue;
                } catch {
                    result[key] = value as unknown;
                    continue;
                }
            }
            // Fallback to NodeCache
            const nodeCacheValue = this.nodeCache.get(key);
            if (nodeCacheValue !== undefined) {
                result[key] = nodeCacheValue as unknown;
            } else {
                result[key] = null;
            }
        }

        return result;
    }

    /**
     * Set a cache value in both Upstash Redis and NodeCache.
     */
    public async setCache(key: string, value: any) {
        await this.redis.set(key, JSON.stringify(value));
        this.nodeCache.set(key, value);
    }

    /**
     * Get a cache value from Upstash Redis or NodeCache.
     * Priority: Upstash Redis > NodeCache
     */
    public async getCache(key: string): Promise<unknown> {
        const value = await this.redis.get(key);
        if (value !== null && value !== undefined) {
            try {
                return typeof value === "string" ? (JSON.parse(value) as unknown) : (value as unknown);
            } catch {
                return value as unknown;
            }
        }
        // Fallback to NodeCache
        const nodeCacheValue = this.nodeCache.get(key);

        return nodeCacheValue !== undefined ? (nodeCacheValue as unknown) : null;
    }
}

export default YoutubeCacheService;
