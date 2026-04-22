export function valveEngine(data, map) {

    const moisture = data?.sensors?.soil?.moisture;

    if (moisture > 40) return null;

    const plantID = data?.identity?.plant_id;
    const plant = map.plants.find(p => p.rfid === plantID);

    if (!plant) return null;

    const valve = map.valves.find(v => v.zone_id === plant.zone_id);

    if (!valve) return null;

    return {
        action: "OPEN_VALVE",
        params: {
            valve_id: valve.valve_id,
            duration: 5000
        }
    };
}