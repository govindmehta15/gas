import { connectDB } from "../../../lib/mongodb.js";

export default async function handler(req, res) {
    const db = await connectDB();
    const device_id = "rover_001";

    if (req.method === "GET") {
        const config = await db.collection("config").findOne({ device_id });
        return res.json({ systemPower: config?.systemPower || "LIVE" });
    }

    if (req.method === "POST") {
        const { systemPower } = req.body; // "LIVE" or "STANDBY"
        
        await db.collection("config").updateOne(
            { device_id },
            { $set: { systemPower, lastPowerUpdate: new Date() } },
            { upsert: true }
        );

        return res.json({ status: "success", systemPower });
    }

    res.status(405).end();
}
