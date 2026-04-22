import { connectDB } from "../../../lib/mongodb.js";
import { generateAIInsight } from "../../../lib/engines/aiEngine.js";

export default async function handler(req, res) {
    if (req.method !== "GET") return res.status(405).end();

    const db = await connectDB();
    
    // 1. Get the latest sensor telemetry
    const latestLogs = await db.collection("sensor_logs")
        .find()
        .sort({ createdAt: -1 })
        .limit(1)
        .toArray();

    if (!latestLogs.length) return res.json({ report: "Waiting for rover data initialization..." });

    const data = latestLogs[0];

    // 2. Fetch Garden Metadata for this plant
    const garden = await db.collection("gardens").findOne({ garden_id: "main_garden" });
    const plantMetadata = garden?.grids[data.plant_id]?.metadata || {};

    // 3. Generate Generative Report
    const report = generateAIInsight(data, plantMetadata);

    return res.json({ report });
}
