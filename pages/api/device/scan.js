import { connectDB } from "../../../lib/mongodb";

export default async function handler(req, res) {
    if (req.method !== "POST") return res.status(405).end();

    const { device_id } = req.body;
    const db = await connectDB();

    // 1. Create a "Scan Request" in the commands collection
    const command = {
        device_id,
        action: "SCAN_TAG",
        createdAt: new Date(),
        status: "pending"
    };

    await db.collection("commands").insertOne(command);

    // 2. Poll for the result (Simple timeout version)
    // In a real prod environment, we would use WebSockets or a longer-lived async response.
    // Here we wait for the ESP32 to upload a sensor log with a new plant_id.
    
    res.json({ status: "scan_triggered", message: "Rover is scanning. Check telemetry for UID." });
}
