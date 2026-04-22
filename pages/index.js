import { useEffect, useState } from "react";

export default function Home() {
    const [activeTab, setActiveTab] = useState('mission');
    const [garden, setGarden] = useState({ width: 10, height: 10, unit: 'ft', grids: {} });
    const [brushType, setBrushType] = useState('plant'); // plant, obstacle, empty
    const [data, setData] = useState({});
    const [vision, setVision] = useState(null);
    const [isOnline, setIsOnline] = useState(false);
    const [target, setTarget] = useState({ x: 0, y: 0 });
    const [path, setPath] = useState([]);
    const [missionStatus, setMissionStatus] = useState("IDLE");
    const [selectedCell, setSelectedCell] = useState(null); // {x, y}
    const [cellInfo, setCellInfo] = useState({ name: '', rfid: '' });
    const [calibration, setCalibration] = useState({ msPerUnit: 250, msPerDegree: 10.5 });
    const [aiReport, setAiReport] = useState("Vanguard AI initialized. Waiting for strategic link...");

    const fetchData = async () => {
        try {
            const res = await fetch("/api/status");
            const json = await res.json();
            setData(json.data || {});
            
            if (json.data?.createdAt) {
                const diff = (new Date() - new Date(json.data.createdAt)) / 1000;
                setIsOnline(diff < 15);
            }

            const vRes = await fetch("/api/device/vision?device_id=esp32_cam_001");
            const vJson = await vRes.json();
            if (vJson.image_data) setVision(vJson);
        } catch (e) { console.error(e); }
    };

    const fetchGarden = async () => {
        try {
            const res = await fetch("/api/garden/blueprint?garden_id=main_garden");
            const json = await res.json();
            setGarden(json);
        } catch (e) { console.error(e); }
    };

    const fetchConfig = async () => {
        try {
            const res = await fetch("/api/device/calibrate");
            const json = await res.json();
            setCalibration(json);
        } catch (e) { console.error(e); }
    };

    const fetchAIReport = async () => {
        try {
            const res = await fetch("/api/analytics/ai-insight");
            const json = await res.json();
            setAiReport(json.report);
        } catch (e) { console.error(e); }
    };

    useEffect(() => {
        fetchData();
        fetchGarden();
        fetchConfig();
        if (activeTab === 'analytics') fetchAIReport();
        const i = setInterval(() => {
            fetchData();
            if (activeTab === 'analytics') fetchAIReport();
        }, 4000);
        return () => clearInterval(i);
    }, [activeTab]);

    const saveCalibration = async () => {
        await fetch("/api/device/calibrate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(calibration)
        });
        alert("Physical Calibration Synced!");
    };

    const saveGarden = async () => {
        await fetch("/api/garden/blueprint?garden_id=main_garden", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(garden)
        });
        alert("Garden Blueprint Saved & Synced to Rover!");
    };

    const toggleGrid = (x, y) => {
        const key = `${x},${y}`;
        const newGrids = { ...garden.grids };
        if (newGrids[key] && newGrids[key].type === brushType) {
            delete newGrids[key];
        } else {
            if (brushType === 'plant') {
                setSelectedCell({ x, y });
                setCellInfo({ name: `Plant ${x},${y}`, rfid: '' });
            } else {
                newGrids[key] = { type: brushType };
            }
        }
        setGarden({ ...garden, grids: newGrids });
    };

    const confirmPlant = () => {
        const key = `${selectedCell.x},${selectedCell.y}`;
        const newGrids = { ...garden.grids };
        newGrids[key] = { type: 'plant', metadata: cellInfo };
        setGarden({ ...garden, grids: newGrids });
        setSelectedCell(null);
    };

    const startMission = async () => {
        setMissionStatus("STARTING...");
        const res = await fetch("/api/control", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "START_MISSION", target })
        });
        const json = await res.json();
        if (json.path) {
            setPath(json.path);
            setMissionStatus("ACTIVE - PATH SYNCED");
        } else {
            setMissionStatus("ERROR: NO PATH");
        }
    };

    const startPatrol = async () => {
        setMissionStatus("ANALYZING GARDEN...");
        const res = await fetch("/api/control", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "START_PATROL" })
        });
        const json = await res.json();
        if (json.path) {
            setPath(json.path);
            setMissionStatus(`PATROL ACTIVE - ${json.plantCount} PLANTS TARGETED`);
        } else {
            setMissionStatus("ERROR: NO REACHABLE PLANTS");
        }
    };

    const stopMission = async () => {
        await fetch("/api/control", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "EMERGENCY_STOP" })
        });
        setMissionStatus("STOPPED");
    };

    return (
        <div className="dashboard-container">
            <header className="header">
                <div>
                    <h1>VANGUARD UNIFIED COMMAND</h1>
                    <nav style={{ display: 'flex', gap: 20, marginTop: 10 }}>
                        <button onClick={() => setActiveTab('mission')} className={`tab-btn ${activeTab === 'mission' ? 'active' : ''}`}>MISSION CONTROL</button>
                        <button onClick={() => setActiveTab('garden')} className={`tab-btn ${activeTab === 'garden' ? 'active' : ''}`}>GARDEN DESIGNER</button>
                        <button onClick={() => setActiveTab('intelligence')} className={`tab-btn ${activeTab === 'intelligence' ? 'active' : ''}`}>INTELLIGENCE</button>
                        <button onClick={() => setActiveTab('analytics')} className={`tab-btn ${activeTab === 'analytics' ? 'active' : ''}`}>VANGUARD AI ADVISOR</button>
                    </nav>
                </div>
                <div className={`status-badge ${isOnline ? 'status-online' : 'status-offline'}`}>
                    {isOnline ? '● ROVER ONLINE' : '○ DISCONNECTED'}
                </div>
            </header>

            {activeTab === 'mission' && (

            <div className="grid">
                {/* 1. MISSION CONTROL PANEL */}
                <div className="card" style={{ gridColumn: 'span 2' }}>
                    <div className="card-title">Mission Control Center</div>
                    <div style={{ display: 'flex', gap: 20, alignItems: 'center', background: '#0a0c10', padding: 20, borderRadius: 12 }}>
                        <div>
                            <span className="label">Operation Status</span>
                            <div className="value" style={{ color: missionStatus === 'ACTIVE' ? 'var(--success)' : 'var(--accent-cyan)' }}>
                                {missionStatus}
                            </div>
                        </div>
                        <div style={{ flex: 1, display: 'flex', gap: 10 }}>
                            <input 
                                type="number" placeholder="X Coord" 
                                style={{ width: 80, padding: 8, background: '#000', color: '#fff', border: '1px solid #333' }}
                                onChange={(e) => setTarget({...target, x: e.target.value})}
                            />
                            <input 
                                type="number" placeholder="Y Coord" 
                                style={{ width: 80, padding: 8, background: '#000', color: '#fff', border: '1px solid #333' }}
                                onChange={(e) => setTarget({...target, y: e.target.value})}
                            />
                        </div>
                        <button onClick={startMission} className="btn-ctrl" style={{ background: 'var(--success)', color: '#000' }}>GO TO COORD</button>
                        <button onClick={startPatrol} className="btn-ctrl" style={{ background: 'var(--accent-cyan)', color: '#000' }}>DEPLOY FULL PATROL</button>
                        <button onClick={stopMission} className="btn-ctrl" style={{ background: 'var(--danger)', color: '#fff' }}>HALT</button>
                    </div>
                </div>

                {/* 2. LIVE VISION */}
                <div className="card">
                    <div className="card-title">Event Vision Feed</div>
                    <div className="vision-stream">
                        {vision ? <img src={vision.image_data} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div className="placeholder">WAITING FOR DATA...</div>}
                    </div>
                </div>

                {/* 3. SENSORS */}
                <div className="card">
                    <div className="card-title">Sensor HUD</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                        <div className="mini-widget">PH: {data.sensors?.soil?.ph?.toFixed(1) || '--'}</div>
                        <div className="mini-widget">Temp: {data.sensors?.environment?.temperature?.toFixed(1) || '--'}°</div>
                    </div>
                </div>
            </div>

            )}

            {activeTab === 'garden' && (
                <div className="card">
                    <div className="card-title">Virtual Garden Designer</div>
                    <div style={{ display: 'flex', gap: 30 }}>
                        <div className="garden-sidebar">
                            <div className="label">Grid Dimensions</div>
                            <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
                                <input type="number" value={garden.width} onChange={(e) => setGarden({...garden, width: parseInt(e.target.value)})} style={{ width: 60 }} />
                                <span>x</span>
                                <input type="number" value={garden.height} onChange={(e) => setGarden({...garden, height: parseInt(e.target.value)})} style={{ width: 60 }} />
                                <select value={garden.unit} onChange={(e) => setGarden({...garden, unit: e.target.value})}>
                                    <option value="ft">Feet</option>
                                    <option value="in">Inches</option>
                                    <option value="m">Meters</option>
                                </select>
                            </div>

                            <div className="label">Editor Tools</div>
                            <div className="tool-box">
                                <button onClick={() => setBrushType('plant')} className={brushType === 'plant' ? 'active' : ''}>🌿 PLACE PLANT</button>
                                <button onClick={() => setBrushType('obstacle')} className={brushType === 'obstacle' ? 'active' : ''}>🪨 PLACE OBSTACLE</button>
                            </div>
                            
                            <button onClick={saveGarden} className="btn-ctrl" style={{ width: '100%', marginTop: 40, background: 'var(--accent-cyan)', color: '#000' }}>
                                SAVE BLUEPRINT
                            </button>
                        </div>

                        <div className="garden-grid-container">
                            <div className="garden-grid" style={{ 
                                display: 'grid', 
                                gridTemplateColumns: `repeat(${garden.width}, 30px)`,
                                gap: 2
                            }}>
                                {[...Array(garden.height)].map((_, y) => 
                                    [...Array(garden.width)].map((_, x) => {
                                        const cell = garden.grids[`${x},${y}`];
                                        const isPath = path.some(p => p.x === x && p.y === y);
                                        const health = cell?.health?.priority || 'NONE';
                                        return (
                                            <div 
                                                key={`${x},${y}`}
                                                className={`grid-cell ${cell?.type || ''} ${isPath ? 'path' : ''} health-${health}`}
                                                onClick={() => toggleGrid(x, y)}
                                                title={cell?.health ? `Next Visit: ${new Date(cell.health.nextVisitTime).toLocaleTimeString()}` : ''}
                                            >
                                                {cell?.metadata?.name && <span className="cell-label">{cell.metadata.name.substring(0,1)}</span>}
                                            </div>
                                        )
                                    })
                                )}
                            </div>
                        </div>
                    </div>
                    
                    {selectedCell && (
                        <div className="modal-overlay">
                            <div className="modal">
                                <h3>Plant Identity Setup</h3>
                                <div className="label">Plant Name</div>
                                <input value={cellInfo.name} onChange={e => setCellInfo({...cellInfo, name: e.target.value})} />
                                <div className="label">RFID Tag (Serial)</div>
                                <input value={cellInfo.rfid} placeholder="e.g., 88005A12BD" onChange={e => setCellInfo({...cellInfo, rfid: e.target.value})} />
                                <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                                    <button onClick={confirmPlant} className="btn-ctrl" style={{ flex: 1, background: 'var(--success)' }}>CONFIRM</button>
                                    <button onClick={() => setSelectedCell(null)} className="btn-ctrl" style={{ flex: 1, background: '#333' }}>CANCEL</button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'intelligence' && (
                <div className="grid">
                    <div className="card" style={{ gridColumn: 'span 2' }}>
                        <div className="card-title">Physical Scaling & Intelligence</div>
                        <div style={{ background: '#0a0c10', padding: 30, borderRadius: 12 }}>
                            <div className="label">Motor Pulse (ms per physical unit)</div>
                            <input 
                                type="range" min="100" max="1000" step="10"
                                value={calibration.msPerUnit}
                                onChange={e => setCalibration({...calibration, msPerUnit: parseInt(e.target.value)})}
                                style={{ width: '100%', accentColor: 'var(--accent-cyan)' }}
                            />
                            <div className="value">{calibration.msPerUnit} ms / unit</div>

                            <div className="label" style={{ marginTop: 30 }}>Turn Rate (ms per degree)</div>
                            <input 
                                type="range" min="1" max="50" step="0.1"
                                value={calibration.msPerDegree}
                                onChange={e => setCalibration({...calibration, msPerDegree: parseFloat(e.target.value)})}
                                style={{ width: '100%', accentColor: 'var(--success)' }}
                            />
                            <div className="value">{calibration.msPerDegree} ms / degree</div>

                            <div style={{ display: 'flex', gap: 20, marginTop: 40 }}>
                                <button onClick={saveCalibration} className="btn-ctrl" style={{ flex: 1, background: 'var(--accent-cyan)', color: '#000' }}>SAVE CALIBRATION</button>
                                <button onClick={() => alert("Sending M:1 command...")} className="btn-ctrl" style={{ flex: 1, border: '1px solid #333' }}>TEST 1 UNIT STEP</button>
                            </div>
                        </div>
                    </div>
                    
                    <div className="card">
                        <div className="card-title">Autonomy Logic</div>
                        <div className="mini-widget" style={{ textAlign: 'left' }}>
                            • 1 Grid Cell = {garden.unit}<br/>
                            • Pathfinder: A* Active<br/>
                            • RFID Match: STRICT<br/>
                            • Re-route on Collision: YES
                        </div>
                    </div>
                </div>
            )}

            <style jsx>{`
                .tab-btn { background: none; border: none; color: #8b949e; cursor: pointer; font-weight: bold; font-size: 0.8rem; padding: 5px 0; border-bottom: 2px solid transparent; }
                .tab-btn.active { color: var(--accent-cyan); border-bottom-color: var(--accent-cyan); }
                .tool-box { display: flex; flex-direction: column; gap: 10px; }
                .tool-box button { background: #161b22; border: 1px solid #30363d; color: #fff; padding: 10px; border-radius: 8px; cursor: pointer; text-align: left; }
                .tool-box button.active { border-color: var(--accent-cyan); background: rgba(0, 243, 255, 0.1); }
                .garden-grid { background: #161b22; padding: 10px; border-radius: 8px; overflow: auto; max-width: 800px; max-height: 500px; }
                .grid-cell { width: 30px; height: 30px; background: #0d1117; border: 1px solid #30363d; cursor: pointer; display: flex; alignItems: center; justifyContent: center; }
                .grid-cell:hover { border-color: #8b949e; }
                .grid-cell.plant::after { content: '🌿'; font-size: 14px; }
                .grid-cell.obstacle { background: #30363d; }
                .grid-cell.obstacle::after { content: '🪨'; font-size: 14px; }
                .grid-cell.path { border: 1px solid var(--accent-cyan); background: rgba(0, 243, 255, 0.1); }
                .grid-cell.path::after { content: '·'; color: var(--accent-cyan); font-weight: bold; }
                .grid-cell.health-CRITICAL { border: 2px solid var(--danger); box-shadow: 0 0 10px rgba(255,0,0,0.2); }
                .grid-cell.health-MEDIUM { border: 1px solid var(--warning); }
                .grid-cell.health-LOW { border: 1px solid var(--success); }
                .cell-label { position: absolute; font-size: 8px; bottom: 1px; color: #fff; text-transform: uppercase; }
                .ai-report-box { 
                    background: rgba(0, 243, 255, 0.02); 
                    padding: 30px; 
                    border-radius: 12px; 
                    border: 1px solid #161b22; 
                    min-height: 400px;
                    font-family: 'JetBrains Mono', 'Courier New', monospace;
                }
                .modal-overlay { position: fixed; top:0; left:0; right:0; bottom:0; background: rgba(0,0,0,0.8); display: flex; align-items: center; justify-content: center; z-index: 100; }
                .modal { background: #0d1117; padding: 30px; border-radius: 16px; border: 1px solid var(--accent-cyan); width: 400px; }
                .modal input { width: 100%; background: #000; border: 1px solid #333; color: #fff; padding: 12px; border-radius: 8px; margin-bottom: 20px; }
                .dashboard-container { padding: 40px; background: #000; min-height: 100vh; color: #fff; font-family: 'Inter', sans-serif; }
                .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 40px; border-bottom: 1px solid #161b22; padding-bottom: 20px; }
                .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; }
                .card { background: #0d1117; border: 1px solid #30363d; padding: 24px; border-radius: 16px; transition: transform 0.2s; }
                .card:hover { border-color: var(--accent-cyan); }
                .card-title { font-size: 0.8rem; letter-spacing: 1px; color: var(--text-secondary); text-transform: uppercase; margin-bottom: 20px; font-weight: bold; }
                .label { display: block; font-size: 0.7rem; color: #8b949e; margin-bottom: 4px; }
                .value { font-size: 1.5rem; font-weight: bold; }
                .vision-stream { background: #000; border-radius: 12px; height: 180px; overflow: hidden; display: flex; align-items: center; justify-content: center; }
                .btn-ctrl { padding: 12px 24px; border-radius: 8px; border: none; font-weight: bold; cursor: pointer; text-transform: uppercase; }
                .mini-widget { background: #161b22; padding: 15px; border-radius: 8px; text-align: center; font-size: 0.9rem; }
            `}</style>
        </div>
    );
}