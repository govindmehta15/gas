import { connectDB } from "../../lib/mongodb.js";

export default async function handler(req, res) {
    if (req.method !== "POST") return res.status(405).end();

    const db = await connectDB();

    const command = req.body;

    await db.collection("commands").insertOne({
        ...command,
        createdAt: new Date()
    });

    res.json({ status: "command sent" });
}