import { irrigationEngine } from "./engines/irrigationEngine";
import { movementEngine } from "./engines/movementEngine";
import { aiEngine } from "./engines/aiEngine";

export function decisionEngine(data) {

    // Priority-based decisions

    // 🚨 Safety first
    const movement = movementEngine(data);
    if (movement) return movement;

    // 🌱 Irrigation
    const irrigation = irrigationEngine(data);
    if (irrigation) return irrigation;

    // 🤖 AI layer
    const ai = aiEngine(data);
    if (ai) return ai;

    // Default
    return { action: "STOP" };
}