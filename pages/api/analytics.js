import { connectDB } from "../../../lib/mongodb";

export default async function handler(req, res) {
    const db = await connectDB();

    // 1. Get 24h Trends (Averaged by Hour)
    const stats = await db.collection("sensor_logs").aggregate([
        {
            $match: {
                createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
            }
        },
        {
            $group: {
                _id: {
                    hour: { $hour: "$createdAt" },
                    day: { $dayOfMonth: "$createdAt" }
                },
                avgMoisture: { $avg: "$sensors.soil.moisture" },
                avgTemp: { $avg: "$sensors.environment.temperature" },
                timestamp: { $first: "$createdAt" }
            }
        },
        { $sort: { "_id.day": 1, "_id.hour": 1 } }
    ]).toArray();

    // 2. Get Plant Specific Activity
    const plants = await db.collection("sensor_logs").aggregate([
        { $match: { plant_id: { $ne: "" } } },
        {
            $group: {
                _id: "$plant_id",
                lastVisit: { $max: "$createdAt" },
                avgMoisture: { $avg: "$sensors.soil.moisture" },
                visits: { $count: {} }
            }
        }
    ]).toArray();

    res.json({ trends: stats, plants });
}
