import { connectDB } from "../../../lib/mongodb";

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

    res.json({ status: "synced", alerts: alerts.length });
}