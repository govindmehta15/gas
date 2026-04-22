export function movementEngine(data) {

    const dist = data?.sensors?.navigation?.distance || 100;

    if (dist < 15) {
        return { action: "STOP" };
    }

    return null;
}