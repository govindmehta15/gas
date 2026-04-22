import { connectDB } from "../../lib/mongodb.js";
import { Pathfinder } from "../../lib/engines/pathfinder.js";
import { translatePathToCommands } from "../../lib/engines/movementEngine.js";

export default async function handler(req, res) {
    if (req.method !== "POST") return res.status(405).end();

    const db = await connectDB();
    const { action, target, garden_id = "main_garden" } = req.body;

    if (action === "START_MISSION" || action === "START_PATROL") {
        // 1. Load Garden Blueprint
        const garden = await db.collection("gardens").findOne({ garden_id });
        if (!garden) return res.status(400).json({ error: "No garden blueprint found" });

        // 2. Define Targets
        let targets = [];
        if (action === "START_PATROL") {
            // Find all plants
            Object.entries(garden.grids).forEach(([key, cell]) => {
                if (cell.type === "plant") {
                    const [x, y] = key.split(",").map(Number);
                    targets.push({ x, y, name: cell.metadata?.name });
                }
            });
            // Simple sort by proximity to start (greedy)
        } else {
            targets = [target];
        }

        // 3. Get current rover position
        const latest = await db.collection("sensor_logs").find().sort({ createdAt: -1 }).limit(1).toArray();
        let currentPos = latest[0]?.position || { x: 0, y: 0 };

        // 4. Calculate Full Multi-Stop Path
        const obstacles = [];
        Object.entries(garden.grids).forEach(([key, cell]) => {
            if (cell.type === "obstacle") {
                const [x, y] = key.split(",").map(Number);
                obstacles.push({ x, y });
            }
        });

        const pf = new Pathfinder(garden.width, garden.height, obstacles);
        let fullPath = [];
        
        for (const t of targets) {
            const p = pf.findPath(currentPos, t);
            if (p) {
                fullPath = [...fullPath, ...p];
                currentPos = t; 
            }
        }

        if (fullPath.length === 0) return res.status(400).json({ error: "No targets reachable" });

        // 5. Load Calibration Data
        const config = await db.collection("config").findOne({ device_id: "rover_001" }) || { msPerUnit: 250, msPerDegree: 10.5 };

        // 6. Translate Path to Physical Commands
        const movementCommands = translatePathToCommands(fullPath, config);

        // 7. Save command sequence and Update Garden State
        await db.collection("commands").insertOne({
            action: "EXECUTE_PATROL",
            path: fullPath,
            movementCommands,
            targets,
            status: "PENDING",
            createdAt: new Date()
        });

        await db.collection("gardens").updateOne(
            { garden_id },
            { $set: { 
                activePath: fullPath, 
                missionStatus: action === "START_PATROL" ? `PATROL ACTIVE - ${targets.length} PLANTS` : "MISSION ACTIVE" 
            }}
        );

        return res.json({ status: "patrol_queued", commandsCount: movementCommands.length, plantCount: targets.length, path: fullPath });
    }

    if (action === "EMERGENCY_STOP") {
        await db.collection("commands").insertOne({
            action: "EMERGENCY_STOP",
            createdAt: new Date()
        });
        await db.collection("gardens").updateOne(
            { garden_id },
            { $set: { activePath: [], missionStatus: "IDLE" }}
        );
        return res.json({ status: "halted" });
    }

    res.status(400).end();
}