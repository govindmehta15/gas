import { connectDB } from "../../lib/mongodb.js";

export default async function handler(req, res) {
    const db = await connectDB();

    const latest = await db.collection("sensor_logs")
        .find().sort({ createdAt: -1 }).limit(1).toArray();

    const cmd = await db.collection("commands")
        .find().sort({ createdAt: -1 }).limit(1).toArray();

    const config = await db.collection("config").findOne({ device_id: "rover_001" });
    let systemPower = config?.systemPower || "LIVE";

    if (systemPower === "LIVE" && latest[0]?.createdAt) {
        const lastSeen = new Date(latest[0].createdAt);
        const hoursDiff = (new Date() - lastSeen) / (1000 * 60 * 60);
        if (hoursDiff > 3) {
            systemPower = "STANDBY";
            await db.collection("config").updateOne(
                { device_id: "rover_001" },
                { $set: { systemPower: "STANDBY" } }
            );
        }
    }

    res.json({
        data: latest[0] || {},
        command: cmd[0] || {},
        systemPower
    });
}