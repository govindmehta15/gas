import { useEffect, useState } from "react";

export default function Home() {
    const [data, setData] = useState({});
    const [vision, setVision] = useState(null);
    const [isOnline, setIsOnline] = useState(false);
    const [target, setTarget] = useState({ x: 0, y: 0 });
    const [missionStatus, setMissionStatus] = useState("IDLE");

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

    useEffect(() => {
        fetchData();
        const i = setInterval(fetchData, 4000);
        return () => clearInterval(i);
    }, []);

    const startMission = async () => {
        setMissionStatus("STARTING...");
        await fetch("/api/control", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "START_MISSION", target })
        });
        setMissionStatus("ACTIVE");
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
                <h1>VANGUARD UNIFIED COMMAND</h1>
                <div className={`status-badge ${isOnline ? 'status-online' : 'status-offline'}`}>
                    {isOnline ? '● ROVER ONLINE' : '○ DISCONNECTED'}
                </div>
            </header>

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
                        <button onClick={startMission} className="btn-ctrl" style={{ background: 'var(--success)', color: '#000' }}>START MISSION</button>
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

            <style jsx>{`
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