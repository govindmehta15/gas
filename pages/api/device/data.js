import { connectDB } from "../../../lib/mongodb.js";
import { planNextVisit } from "../../../lib/engines/taskPlanner.js";

export default async function handler(req, res) {
    if (req.method !== "POST") return res.status(405).end();

    const apiKey = req.headers["x-api-key"];
    if (apiKey !== "AGRO_ROVER_SECURE_KEY_2024") {
        return res.status(401).json({ error: "Unauthorized" });
    }

    const db = await connectDB();
    const data = req.body;

    if (!data.device_id) {
        return res.status(400).json({ error: "Missing device_id" });
    }

    // 1. Process Master Telemetry
    await db.collection("sensor_logs").insertOne({
        ...data,
        createdAt: new Date()
    });

    // 2. 🚨 Maintenance Event Detection 📷
    // If a plant is identified, trigger a photo request for the ESP32-CAM
    if (data.plant_id && data.plant_id !== "NONE") {
        await db.collection("commands").insertOne({
            device_id: "esp32_cam_001",
            action: "CAPTURE_PHOTO",
            plant_id: data.plant_id,
            createdAt: new Date(),
            status: "pending"
        });
    }

    // 3. Smart Alerts (PH, Temperature, etc.)
    const alerts = [];
    if (data.sensors?.soil?.ph > 8.0) alerts.push("HIGH_PH");
    if (data.sensors?.environment?.temperature > 40) alerts.push("HEAT_WARNING");

    if (alerts.length > 0) {
        await db.collection("alerts").insertOne({
            device_id: data.device_id,
            types: alerts,
            createdAt: new Date()
        });
    }

    // 3. Smart Scheduling: Decide next visit based on health
    const healthPlan = planNextVisit({ device_id: data.device_id, plant_id: data.plant_id }, data.sensors);
    
    await db.collection("sensor_logs").insertOne({
        device_id: data.device_id,
        plant_id: data.plant_id,
        sensors: data.sensors,
        position: data.position,
        healthPlan, // Store the priority and next visit time
        createdAt: new Date()
    });

    // 4. Update the Garden Blueprint with the latest health status
    if (data.plant_id && data.plant_id !== "NONE") {
        const [x, y] = data.plant_id.split(","); // Assuming plant_id format "x,y"
        if (!isNaN(x) && !isNaN(y)) {
             await db.collection("gardens").updateOne(
                { "grids": { [data.plant_id]: { "$exists": true } } }, 
                { "$set": { [`grids.${x},${y}.health`]: healthPlan } }
            );
        }
    }

    res.json({ status: "synced", alerts: alerts.length });
}