export function taskPlanner(map, tasks) {

    // Simple version (expand later)
    return tasks.map(task => ({
        action: "MOVE_TO",
        params: task.position
    }));
}