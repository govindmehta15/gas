import { connectDB } from "../../lib/mongodb.js";
import { Pathfinder } from "../../lib/engines/pathfinder.js";

export default async function handler(req, res) {
    if (req.method !== "POST") return res.status(405).end();

    const db = await connectDB();
    const { action, target, garden_id = "main_garden" } = req.body;

    if (action === "START_MISSION") {
        // 1. Load Garden Blueprint
        const garden = await db.collection("gardens").findOne({ garden_id });
        
        // 2. Get current rover position (from sensor logs)
        const latest = await db.collection("sensor_logs").find().sort({ createdAt: -1 }).limit(1).toArray();
        const start = latest[0]?.position || { x: 0, y: 0 };

        // 3. Extract obstacles
        const obstacles = [];
        if (garden?.grids) {
            Object.entries(garden.grids).forEach(([key, type]) => {
                if (type === "obstacle") {
                    const [x, y] = key.split(",").map(Number);
                    obstacles.push({ x, y });
                }
            });
        }

        // 4. Calculate Path
        const pf = new Pathfinder(garden?.width || 10, garden?.height || 10, obstacles);
        const path = pf.findPath(start, target);

        if (!path) return res.status(400).json({ error: "No path found to target" });

        // 5. Save command sequence
        await db.collection("commands").insertOne({
            action: "EXECUTE_PATH",
            path,
            target,
            status: "PENDING",
            createdAt: new Date()
        });

        return res.json({ status: "mission_queued", path });
    }

    if (action === "EMERGENCY_STOP") {
        await db.collection("commands").insertOne({
            action: "EMERGENCY_STOP",
            createdAt: new Date()
        });
        return res.json({ status: "halted" });
    }

    res.status(400).end();
}