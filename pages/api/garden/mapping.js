import { connectDB } from "../../../lib/mongodb.js";

export default async function handler(req, res) {
    const db = await connectDB();
    const { garden_id } = req.query;

    if (req.method === "GET") {
        const garden = await db.collection("gardens").findOne({ garden_id });
        return res.json(garden || { 
            garden_id, 
            width: 100, 
            height: 100, 
            unit: "inches", 
            entities: [] 
        });
    }

    if (req.method === "POST") {
        const gardenData = req.body;
        await db.collection("gardens").updateOne(
            { garden_id: gardenData.garden_id },
            { $set: { ...gardenData, updatedAt: new Date() } },
            { upsert: true }
        );

        // Auto-assign rover if needed
        if (gardenData.rover_id) {
            await db.collection("devices_config").updateOne(
                { device_id: gardenData.rover_id },
                { $set: { current_garden: gardenData.garden_id } },
                { upsert: true }
            );
        }

        return res.json({ status: "garden blueprint saved" });
    }

    res.status(405).end();
}
