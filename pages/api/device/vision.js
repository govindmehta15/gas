import { connectDB } from "../../../lib/mongodb.js";

    const db = await connectDB();

    if (req.method === "GET") {
        const { device_id } = req.query;
        const feed = await db.collection("vision_feed").findOne({ device_id });
        return res.json(feed || { error: "No vision data found" });
    }

    if (req.method !== "POST") return res.status(405).end();

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
