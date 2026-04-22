export function irrigationEngine(data) {

    const moisture = data?.sensors?.soil?.moisture || 0;
    const temp = data?.sensors?.environment?.temperature || 0;
    const plant = data?.identity?.plant_id || "default";

    // 🌱 Plant-specific configs (can move to DB later)
    const plantProfiles = {
        default: { minMoisture: 40, water: 200 },
        tomato: { minMoisture: 50, water: 250 },
        wheat: { minMoisture: 35, water: 180 }
    };

    const profile = plantProfiles[plant] || plantProfiles["default"];

    // 🔥 Decision logic
    if (moisture < profile.minMoisture) {

        let waterAmount = profile.water;

        // Temperature compensation
        if (temp > 35) waterAmount += 50;

        return {
            action: "IRRIGATE",
            params: {
                water_ml: waterAmount
            }
        };
    }

    return null;
}