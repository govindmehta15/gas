import { connectDB } from "../../../lib/mongodb";

export default async function handler(req, res) {
    const db = await connectDB();
    const { device_id } = req.query;

    if (req.method === "GET") {
        const config = await db.collection("devices_config").findOne({ device_id });
        return res.json(config || { width_ms: 3000, depth_ms: 10000 });
    }

    if (req.method === "POST") {
        const newConfig = req.body;
        await db.collection("devices_config").updateOne(
            { device_id },
            { $set: { ...newConfig, updatedAt: new Date() } },
            { upsert: true }
        );
        return res.json({ status: "config saved" });
    }

    res.status(405).end();
}