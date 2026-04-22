import { connectDB } from "../../../lib/mongodb";
import { decisionEngine } from "../../../lib/decisionEngine";

export default async function handler(req, res) {
    // 🔒 Security Check
    const apiKey = req.headers["x-api-key"];
    if (apiKey !== "AGRO_ROVER_SECURE_KEY_2024") {
        return res.status(401).json({ error: "Unauthorized access detected." });
    }

    const { device_id } = req.query;
    const db = await connectDB();

    // 1️⃣ Check for manual override commands (within last 30 seconds)
    const thirtySecondsAgo = new Date(Date.now() - 30 * 1000);
    const manualCommand = await db.collection("commands")
        .find({ 
            device_id, 
            createdAt: { $gte: thirtySecondsAgo } 
        })
        .sort({ createdAt: -1 })
        .limit(1)
        .toArray();

    if (manualCommand.length > 0) {
        return res.json(manualCommand[0]);
    }

    // 2️⃣ Fallback to Autonomous Decision Engine
    const latest = await db.collection("sensor_logs")
        .find({ device_id })
        .sort({ createdAt: -1 })
        .limit(1)
        .toArray();

    const data = latest[0] || {};
    const command = decisionEngine(data);

    res.json(command);
}