/**
 * Vanguard AI Insight Engine
 * Generates sophisticated, human-like strategically-focused reports 
 * based on synthesized multisensory telemetry.
 */
export function generateAIInsight(data, plantMetadata = {}) {
    const { sensors, plant_id } = data;
    const { temperature, humidity } = sensors?.environment || {};
    const { ph, moisture } = sensors?.soil || {};
    const plantName = plantMetadata?.name || "Unidentified Flora";

    // 🧠 Synthesis Logic (Heuristic Analysis)
    const isHeatStress = temperature > 32;
    const isDehydration = moisture < 40;
    const isPhImbalance = ph < 5.5 || ph > 7.5;

    // ✍️ Report Generation (LLM-Style)
    const report = [];

    // 1. Executive Summary
    report.push(`### 🤖 VANGUARD AI STRATEGIC SUMMARY [Target: ${plantName}]`);
    
    if (!isHeatStress && !isDehydration && !isPhImbalance) {
        report.push(`The biosphere in grid ${plant_id} is currently in a state of high-equilibrium. Biological processes are optimized for maximum yield.`);
    } else {
        report.push(`Critical anomalies detected in the localized ecosystem. Strategic intervention is advised to prevent biomass degradation.`);
    }

    // 2. Biosphere Metrics Analysis
    report.push(`\n**BIOSPHERE OBSERVATIONS:**`);
    report.push(`*   **Thermodynamic State:** Thermal readings are at ${temperature}°C. ${isHeatStress ? "Exothermic stress detected; transpiration rates may be exceeding safe thresholds." : "Stable thermal conditions confirmed."}`);
    report.push(`*   **Hydraulic Saturation:** Soil moisture is currently ${moisture}%. ${isDehydration ? "Hydraulic deficit detected. The xylem transport system is at risk of cavitation." : "Optimal hydraulic pressure maintained."}`);
    report.push(`*   **Chemical Balance:** Substrate pH measured at ${ph}. ${isPhImbalance ? "Chemical variance detected. Nutrient bioavailability is currently restricted." : "Nutrient bioavailability is optimized."}`);

    // 3. Strategic Recommendations
    report.push(`\n**ACTIONABLE INTELLIGENCE:**`);
    if (isDehydration) report.push(`*   **Immediate:** Initiate precision irrigation sequence at grid ${plant_id}. Target 15% moisture increase.`);
    if (isHeatStress) report.push(`*   **Preventative:** Consider shade deployment or localized cooling to mitigate thermal radiation.`);
    if (isPhImbalance) report.push(`*   **Remediation:** Apply pH buffering agents to restore chemical stability for enhanced nutrient uptake.`);

    return report.join('\n');
}