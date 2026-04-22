import { connectDB } from "../../../lib/mongodb.js";

export default async function handler(req, res) {
    const db = await connectDB();
    const device_id = "rover_001";

    if (req.method === "GET") {
        const config = await db.collection("config").findOne({ device_id });
        return res.json(config || { 
            device_id,
            msPerUnit: 250,
            msPerDegree: 10.5
        });
    }

    if (req.method === "POST") {
        const { msPerUnit, msPerDegree } = req.body;
        await db.collection("config").updateOne(
            { device_id },
            { $set: { msPerUnit, msPerDegree, updatedAt: new Date() } },
            { upsert: true }
        );
        return res.json({ status: "config_saved" });
    }

    res.status(405).end();
}
