/**
 * Vanguard Movement Engine
 * Translates a series of grid coordinates into physical Arduino commands (M:X, T:D).
 */
export function translatePathToCommands(path, config = { msPerUnit: 250, msPerDegree: 10.5 }) {
    if (!path || path.length < 2) return [];

    const commands = [];
    let currentHeading = 0; // 0: North, 90: East, 180: South, 270: West

    for (let i = 0; i < path.length - 1; i++) {
        const start = path[i];
        const next = path[i + 1];

        // 1. Calculate Vector
        const dx = next.x - start.x;
        const dy = next.y - start.y;

        // 2. Determine Required Heading
        let targetHeading = currentHeading;
        if (dx > 0) targetHeading = 90;       // East
        else if (dx < 0) targetHeading = 270; // West
        else if (dy > 0) targetHeading = 0;   // North
        else if (dy < 0) targetHeading = 180; // South

        // 3. Generate Turn Command if needed
        if (targetHeading !== currentHeading) {
            let turnAngle = targetHeading - currentHeading;
            if (turnAngle > 180) turnAngle -= 360;
            if (turnAngle < -180) turnAngle += 360;

            const turnType = turnAngle > 0 ? "RIGHT" : "LEFT";
            commands.push({
                type: "TURN",
                angle: Math.abs(turnAngle),
                arduinoCode: `T:${Math.abs(turnAngle)}`,
                duration: Math.abs(turnAngle) * config.msPerDegree
            });
            currentHeading = targetHeading;
        }

        // 4. Generate Move Command
        // We move 1 grid cell at a time in this logic for maximum precision
        commands.push({
            type: "MOVE",
            units: 1,
            arduinoCode: `M:1`,
            duration: config.msPerUnit
        });
    }

    commands.push({ type: "STOP", arduinoCode: "S", duration: 0 });
    return commands;
}