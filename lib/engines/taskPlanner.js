/**
 * Health-Based Task Planner
 * Schedules the next visit for a plant based on its soil moisture and pH health.
 */
export function planNextVisit(plantMetadata, latestTelemetry) {
    const moisture = latestTelemetry?.soil?.moisture || 100;
    const ph = latestTelemetry?.soil?.ph || 7.0;

    let priority = "LOW";
    let hoursToNextVisit = 24; // Default: 24 hours

    // 💧 Moisture-based logic
    if (moisture < 30) {
        priority = "CRITICAL";
        hoursToNextVisit = 2; // Visit very soon
    } else if (moisture < 60) {
        priority = "MEDIUM";
        hoursToNextVisit = 6;
    }

    // 🧪 pH-based logic (Alert if pH is outside 5.5 - 7.5)
    if (ph < 5.5 || ph > 7.5) {
        priority = "HIGH"; // Requires inspection
        hoursToNextVisit = Math.min(hoursToNextVisit, 4);
    }

    const nextVisitDate = new Date();
    nextVisitDate.setHours(nextVisitDate.getHours() + hoursToNextVisit);

    return {
        priority,
        nextVisitTime: nextVisitDate,
        reason: priority === "CRITICAL" ? "Low Moisture Alert" : "Routine Health Check"
    };
}