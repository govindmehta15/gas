import { connectDB } from "../../../lib/mongodb.js";

export default async function handler(req, res) {
    const db = await connectDB();
    const { garden_id } = req.query;

    if (req.method === "GET") {
        const garden = await db.collection("gardens").findOne({ garden_id });
        return res.json(garden || { 
            garden_id, 
            width: 10, 
            height: 10, 
            unit: "ft", 
            grids: {} 
        });
    }

    if (req.method === "POST") {
        const { garden_id, grids, width, height, unit } = req.body;
        await db.collection("gardens").updateOne(
            { garden_id },
            { $set: { grids, width, height, unit, updatedAt: new Date() } },
            { upsert: true }
        );
        return res.json({ status: "garden_saved" });
    }

    res.status(405).end();
}
