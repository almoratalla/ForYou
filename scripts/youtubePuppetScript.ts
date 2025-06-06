import { YoutubeCacheService } from "../src/server/service/youtubeCache";
import YoutubeData from "../src/server/service/youtubeData";

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

const run = async (): Promise<void> => {
    const youtubeData = new YoutubeData();
    try {
        const initialExploreData = (await youtubeData.getYoutubeExploreData()) as YoutubeExploreData;
        const d = new Date();
        const ec = initialExploreData.contents.map((obj) => ({ ...obj, date: d, timestamp: d.valueOf() }));
        const ercs =
            initialExploreData.richContents
                .find((f) => typeof f.type === "string" && (f.type === "shorts" || f.type.includes("shorts")))
                ?.contents.map((obj) => ({ ...obj, date: d, timestamp: d.valueOf() })) || [];
        const erct =
            initialExploreData.richContents
                .find((f) => typeof f.type === "string" && (f.type === "trending" || f.type.includes("trending")))
                ?.contents.map((obj) => ({ ...obj, date: d, timestamp: d.valueOf() })) || [];
        const erco =
            initialExploreData.richContents.filter((f) => typeof f.type === "string" && f.type !== "shorts" && !f.type.includes("shorts") && f.type !== "trending" && !f.type.includes("trending")) ||
            [];

        // Store in YoutubeCacheService (which handles Upstash and NodeCache)
        await cacheService.setCache(YTDATA_EXPLORE_CONTENTS, ec);
        await cacheService.setCache(YTDATA_EXPLORE_RICHCONTENTS_SHORTS, ercs);
        await cacheService.setCache(YTDATA_EXPLORE_RICHCONTENTS_TRENDING, erct);
        await cacheService.setCache(YTDATA_EXPLORE_RICHCONTENTS_OTHERS, erco);

        // Data cached successfully.
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
