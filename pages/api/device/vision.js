import { connectDB } from "../../../lib/mongodb.js";

export default async function handler(req, res) {
    if (req.method !== "POST") return res.status(405).end();

    const apiKey = req.headers["x-api-key"];
    if (apiKey !== "AGRO_ROVER_SECURE_KEY_2024") {
        return res.status(401).json({ error: "Unauthorized" });
    }

    const { device_id, image_data, plant_id } = req.body;
    const db = await connectDB();

    // Store the latest vision frame
    await db.collection("vision_feed").updateOne(
        { device_id },
        { 
            $set: { 
                image_data, 
                plant_id,
                updatedAt: new Date() 
            } 
        },
        { upsert: true }
    );

    res.json({ status: "vision_stored" });
}
