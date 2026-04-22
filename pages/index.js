import { useEffect, useState } from "react";

export default function Home() {
    const [data, setData] = useState({});
    const [vision, setVision] = useState(null);
    const [activeTab, setActiveTab] = useState('mission');
    const [isOnline, setIsOnline] = useState(false);

    const fetchData = async () => {
        try {
            const res = await fetch("/api/status");
            const json = await res.json();
            setData(json.data || {});
            
            // Check online status
            if (json.data?.createdAt) {
                const diff = (new Date() - new Date(json.data.createdAt)) / 1000;
                setIsOnline(diff < 15);
            }

            // Fetch Latest Vision
            const vRes = await fetch("/api/status"); // Assuming vision is part of master status for speed
            // Or a separate endpoint if needed...
        } catch (e) {
            console.error(e);
        }
    };

    useEffect(() => {
        fetchData();
        const i = setInterval(fetchData, 4000);
        return () => clearInterval(i);
    }, []);

    const sensors = data.sensors || {};
    const env = sensors.environment || {};
    const soil = sensors.soil || {};

    return (
        <div className="dashboard-container">
            <header className="header">
                <h1>VANGUARD UNIFIED COMMAND</h1>
                <div className={`status-badge ${isOnline ? 'status-online' : 'status-offline'}`}>
                    {isOnline ? '● FULL SYSTEM SYNC' : '○ DISCONNECTED'}
                </div>
            </header>

            <div className="grid">
                {/* 1. Integrated Sensor HUD */}
                <div className="card" style={{ flex: 2 }}>
                    <div className="card-title">Atmospheric & Soil Intelligence</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20 }}>
                        <div className="sensor-widget">
                            <span className="label">Ambient Temp</span>
                            <div className="value">{env.temperature?.toFixed(1) || '--'}°C</div>
                        </div>
                        <div className="sensor-widget">
                            <span className="label">Soil PH</span>
                            <div className="value" style={{ color: 'var(--success)' }}>{soil.ph?.toFixed(1) || '--'}</div>
                        </div>
                        <div className="sensor-widget">
                            <span className="label">Light Intensity</span>
                            <div className="value">{soil.light || '--'} LUX</div>
                        </div>
                    </div>
                </div>

                {/* 2. Live Vision Card */}
                <div className="card">
                    <div className="card-title">Live Vision Feed (at Target)</div>
                    <div className="vision-stream" style={{ background: '#000', borderRadius: 8, height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {vision ? (
                            <img src={vision.image_data} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                            <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>WAITING FOR PLANT CONTACT...</div>
                        )}
                    </div>
                </div>
            </div>

            <div className="grid" style={{ marginTop: 20 }}>
                <div className="card" style={{ flex: 1 }}>
                    <div className="card-title">Processing Core Health</div>
                    <div className="health-item">Arduino (Motors/Nav): <span style={{color: 'var(--success)'}}>ACTIVE</span></div>
                    <div className="health-item">ESP32 (Intelligence): <span style={{color: 'var(--success)'}}>ACTIVE</span></div>
                    <div className="health-item">ESP32-CAM (Vision): <span style={{color: 'var(--accent-cyan)'}}>STANDBY</span></div>
                </div>

                <div className="card" style={{ flex: 2 }}>
                    <div className="card-title">Active Plant Maintenance</div>
                    <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
                        <div style={{ fontSize: '2rem' }}>🌿</div>
                        <div>
                            <div className="label">CURRENT TARGET</div>
                            <div className="value" style={{ fontSize: '1.2rem', color: 'var(--accent-cyan)' }}>{data.plant_id || 'IDLE_SEARCHING'}</div>
                        </div>
                        <div style={{ borderLeft: '1px solid #333', paddingLeft: 20 }}>
                            <div className="label">DEPLOYMENT</div>
                            <div style={{ color: data.is_deployed ? 'var(--danger)' : 'var(--success)' }}>
                                {data.is_deployed ? '● SENSOR PENETRATING' : '○ RETRACTED'}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <style jsx>{`
                .sensor-widget { text-align: center; background: rgba(255,255,255,0.02); padding: 15px; border-radius: 8px; border: 1px solid #161b22; }
                .label { display: block; font-size: 0.7rem; color: var(--text-secondary); text-transform: uppercase; margin-bottom: 5px; }
                .value { font-size: 1.5rem; font-weight: bold; }
                .health-item { margin-bottom: 10px; font-size: 0.9rem; border-bottom: 1px solid #161b22; padding-bottom: 5px; }
            `}</style>
        </div>
    );
}