import dotenv from "dotenv";

import { YoutubeCacheService } from "../src/server/service/youtubeCache";
import YoutubeData from "../src/server/service/youtubeData";
dotenv.config();

const cacheService = new YoutubeCacheService();

const YTDATA_EXPLORE_CONTENTS = "YTDATA_EXPLORE_CONTENTS";
const YTDATA_EXPLORE_RICHCONTENTS_SHORTS = "YTDATA_EXPLORE_RICHCONTENTS_SHORTS";
const YTDATA_EXPLORE_RICHCONTENTS_TRENDING = "YTDATA_EXPLORE_RICHCONTENTS_TRENDING";
const YTDATA_EXPLORE_RICHCONTENTS_OTHERS = "YTDATA_EXPLORE_RICHCONTENTS_OTHERS";

interface YoutubeContent {
    [key: string]: unknown;
}

interface RichContent {
    type: string;
    contents: YoutubeContent[];
}

interface YoutubeExploreData {
    contents: YoutubeContent[];
    richContents: RichContent[];
}

// Utility to deduplicate by id
const uniqueById = <T extends { id?: string }>(arr: T[]): T[] => {
    const seen = new Set<string>();

    return arr.filter((item) => {
        if (!item.id) {
            return false;
        }

        if (seen.has(item.id)) {
            return false;
        }

        seen.add(item.id);

        return true;
    });
};

const run = async (): Promise<void> => {
    const youtubeData = new YoutubeData();
    try {
        const initialExploreData = (await youtubeData.getYoutubeExploreData()) as YoutubeExploreData;
        const d = new Date();
        const ec = uniqueById(
            initialExploreData.contents.map((obj) => {
                if (typeof obj === "object" && obj !== null && "id" in obj) {
                    const id = (obj as { id?: string }).id;

                    return {
                        ...obj,
                        id,
                        date: d,
                        timestamp: d.valueOf()
                    };
                }

                return {} as YoutubeContent;
            })
        );
        const ercs = uniqueById(
            ((initialExploreData.richContents.find((f) => typeof f.type === "string" && (f.type === "shorts" || f.type.includes("shorts")))?.contents as YoutubeContent[]) || []).map(
                (obj: YoutubeContent) => ({
                    ...obj,
                    id: (obj as { id?: string }).id,
                    date: d,
                    timestamp: d.valueOf()
                })
            )
        );
        const erct = uniqueById(
            initialExploreData.richContents
                .find((f) => typeof f.type === "string" && (f.type === "trending" || f.type.includes("trending")))
                ?.contents.map((obj) => ({ ...obj, id: (obj as { id?: string }).id, date: d, timestamp: d.valueOf() })) || []
        );
        const erco =
            initialExploreData.richContents
                .filter((f) => typeof f.type === "string" && f.type !== "shorts" && !f.type.includes("shorts") && f.type !== "trending" && !f.type.includes("trending"))
                .map((rc) => ({
                    ...rc,
                    contents: uniqueById(rc.contents.map((obj) => ({ ...obj, id: (obj as { id?: string }).id, date: d, timestamp: d.valueOf() })))
                })) || [];

        // Store in YoutubeCacheService (which handles Upstash and NodeCache)
        await cacheService.setCache(YTDATA_EXPLORE_CONTENTS, ec);
        await cacheService.setCache(YTDATA_EXPLORE_RICHCONTENTS_SHORTS, ercs);
        await cacheService.setCache(YTDATA_EXPLORE_RICHCONTENTS_TRENDING, erct);
        await cacheService.setCache(YTDATA_EXPLORE_RICHCONTENTS_OTHERS, erco);

        // Data cached successfully.
        process.exit(0); // Success, exit cleanly
    } catch (err) {
        // Failed to fetch/cache YouTube data.
        process.exit(1);
    }
};

run().catch((err) => {
    // Handle any uncaught errors from run
    // eslint-disable-next-line no-console
    console.error("Unhandled error in run():", err);
    process.exit(1);
});
