import { connectDB } from "../../lib/mongodb";

export default async function handler(req, res) {
    const db = await connectDB();

    const latest = await db.collection("sensor_logs")
        .find().sort({ createdAt: -1 }).limit(1).toArray();

    const cmd = await db.collection("commands")
        .find().sort({ createdAt: -1 }).limit(1).toArray();

    res.json({
        data: latest[0] || {},
        command: cmd[0] || {}
    });
}