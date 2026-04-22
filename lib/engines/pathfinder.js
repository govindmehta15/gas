export class Pathfinder {
    constructor(width, height, obstacles = []) {
        this.width = width;
        this.height = height;
        this.obstacles = obstacles; // Array of {x, y}
    }

    isObstacle(x, y) {
        return this.obstacles.some(o => o.x === x && o.y === y);
    }

    getNeighbors(node) {
        const neighbors = [];
        const dirs = [
            { x: 0, y: 1 }, { x: 1, y: 0 },
            { x: 0, y: -1 }, { x: -1, y: 0 }
        ];

        for (const dir of dirs) {
            const nextX = node.x + dir.x;
            const nextY = node.y + dir.y;

            if (nextX >= 0 && nextX < this.width && nextY >= 0 && nextY < this.height) {
                if (!this.isObstacle(nextX, nextY)) {
                    neighbors.push({ x: nextX, y: nextY });
                }
            }
        }
        return neighbors;
    }

    heuristic(a, b) {
        return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
    }

    findPath(start, end) {
        const openSet = [start];
        const cameFrom = new Map();
        
        const gScore = new Map();
        const fScore = new Map();
        
        const key = (n) => `${n.x},${n.y}`;
        
        gScore.set(key(start), 0);
        fScore.set(key(start), this.heuristic(start, end));

        while (openSet.length > 0) {
            // Get node with lowest fScore
            openSet.sort((a, b) => fScore.get(key(a)) - fScore.get(key(b)));
            const current = openSet.shift();

            if (current.x === end.x && current.y === end.y) {
                return this.reconstructPath(cameFrom, current);
            }

            for (const neighbor of this.getNeighbors(current)) {
                const tentativeGScore = gScore.get(key(current)) + 1;

                if (!gScore.has(key(neighbor)) || tentativeGScore < gScore.get(key(neighbor))) {
                    cameFrom.set(key(neighbor), current);
                    gScore.set(key(neighbor), tentativeGScore);
                    fScore.set(key(neighbor), tentativeGScore + this.heuristic(neighbor, end));
                    
                    if (!openSet.some(n => n.x === neighbor.x && n.y === neighbor.y)) {
                        openSet.push(neighbor);
                    }
                }
            }
        }
        return null; // No path found
    }

    reconstructPath(cameFrom, current) {
        const totalPath = [current];
        const key = (n) => `${n.x},${n.y}`;
        while (cameFrom.has(key(current))) {
            current = cameFrom.get(key(current));
            totalPath.unshift(current);
        }
        return totalPath;
    }
}
