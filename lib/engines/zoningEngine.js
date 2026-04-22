export function zoningEngine(data, map) {

    const plantID = data?.identity?.plant_id;

    if (!plantID) return null;

    const plant = map.plants.find(p => p.rfid === plantID);

    if (!plant) return null;

    return {
        action: "MOVE_TO",
        params: {
            x: plant.position.x,
            y: plant.position.y
        }
    };
}