"use client";

import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Rectangle, Tooltip } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Research Paper Table 3 Standardized 4-Tier Palette
export const getRiskColor = (risk) => {
    if (risk >= 0.75) return '#ef4444'; // Imminent [0.75, 1.00] - Red
    if (risk >= 0.60) return '#f97316'; // High [0.60, 0.75) - Orange
    if (risk >= 0.35) return '#eab308'; // Medium [0.35, 0.60) - Yellow
    return '#22c55e';                   // Low [0.00, 0.35) - Green
};

export const getRiskLevel = (risk) => {
    if (risk >= 0.75) return 'Imminent';
    if (risk >= 0.60) return 'High';
    if (risk >= 0.35) return 'Medium';
    return 'Low';
};

// Safe Mine Exit Gates (Paper Section 4.2 designated exits)
const SAFE_EXITS = [
    { id: 'GATE_NORTH_2', name: 'North Bench Exit 2', lat: 11.1090, lng: 79.1530, type: 'primary' },
    { id: 'GATE_SOUTH_HAUL', name: 'South Haul Ramp Gate', lat: 11.1015, lng: 79.1475, type: 'secondary' },
    { id: 'GATE_EAST_PORTAL', name: 'East Portal Exit', lat: 11.1065, lng: 79.1545, type: 'emergency' }
];

// Key Geotechnical Sensors installed at Tamil Nadu Limestone Mine
const GEOTECH_SENSORS = [
    { id: 'SN_STRAIN_01', name: 'Strain-Bar Extensometer #1', lat: 11.1055, lng: 79.1502, factor: '0.035 mm/Ω', status: 'ACTIVE' },
    { id: 'SN_PIEZO_02', name: 'Piezometer Pore Pressure #2', lat: 11.1042, lng: 79.1512, factor: 'kPa', status: 'ACTIVE' },
    { id: 'SN_TILT_03', name: 'Biaxial Tiltmeter #3', lat: 11.1060, lng: 79.1495, factor: 'degrees', status: 'ACTIVE' }
];

// Custom Icons using L.divIcon
const exitIcon = L.divIcon({
    className: 'custom-exit-marker',
    html: `<div style="
        background: #16a34a;
        color: white;
        border: 2px solid white;
        border-radius: 8px;
        padding: 4px 6px;
        font-size: 11px;
        font-weight: bold;
        display: flex;
        align-items: center;
        gap: 4px;
        box-shadow: 0 4px 10px rgba(0,0,0,0.3);
        white-space: nowrap;
    ">
        <span>🛡️</span> EXIT
    </div>`,
    iconSize: [60, 26],
    iconAnchor: [30, 13]
});

const sensorIcon = L.divIcon({
    className: 'custom-sensor-marker',
    html: `<div style="
        width: 14px;
        height: 14px;
        background: #3b82f6;
        border: 2px solid #ffffff;
        border-radius: 50%;
        box-shadow: 0 0 8px rgba(59, 130, 246, 0.8);
    "></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7]
});

const manualIcon = L.divIcon({
    className: 'custom-manual-marker',
    html: `<div style="
        width: 22px;
        height: 22px;
        background: #8b5cf6;
        border: 3px solid #fff;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        box-shadow: 0 3px 10px rgba(139, 92, 246, 0.5);
    "></div>`,
    iconSize: [22, 22],
    iconAnchor: [11, 22]
});

export default function HeatmapMap({ points = [], center = [11.1053, 79.1506], zoom = 16 }) {
    const [showExits, setShowExits] = useState(true);
    const [showSensors, setShowSensors] = useState(true);
    const [showImpassableOnly, setShowImpassableOnly] = useState(false);

    const UpdateView = ({ center, zoom }) => {
        const map = useMap();
        useEffect(() => {
            map.setView(center, zoom);
        }, [center, zoom, map]);
        return null;
    };

    // Calculate dynamic cell size for 20x20 grid (~28-30 meters)
    const CELL_SIZE = 0.00014;

    const displayedPoints = showImpassableOnly
        ? points.filter(p => p.risk >= 0.60)
        : points;

    return (
        <div className="relative w-full h-full">
            {/* Map Controls Floating Overlay */}
            <div className="absolute top-4 right-4 z-[400] bg-white/95 backdrop-blur-md p-3 rounded-xl shadow-xl border border-gray-200 text-xs space-y-2">
                <p className="font-bold text-gray-800 uppercase tracking-wider text-[10px] pb-1 border-b">
                    20×20 IDW Grid Layers
                </p>
                <label className="flex items-center gap-2 cursor-pointer text-gray-700 hover:text-gray-900">
                    <input
                        type="checkbox"
                        checked={showExits}
                        onChange={(e) => setShowExits(e.target.checked)}
                        className="rounded text-green-600 focus:ring-green-500"
                    />
                    <span>🛡️ Safe Exits ({SAFE_EXITS.length})</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-gray-700 hover:text-gray-900">
                    <input
                        type="checkbox"
                        checked={showSensors}
                        onChange={(e) => setShowSensors(e.target.checked)}
                        className="rounded text-blue-600 focus:ring-blue-500"
                    />
                    <span>📡 Geotech Sensors ({GEOTECH_SENSORS.length})</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-gray-700 hover:text-gray-900">
                    <input
                        type="checkbox"
                        checked={showImpassableOnly}
                        onChange={(e) => setShowImpassableOnly(e.target.checked)}
                        className="rounded text-red-600 focus:ring-red-500"
                    />
                    <span>🚫 Impassable Only (Risk &ge; 0.60)</span>
                </label>
            </div>

            {/* Map Legend (Bottom-Left) */}
            <div className="absolute bottom-4 left-4 z-[400] bg-white/95 backdrop-blur-md px-3 py-2.5 rounded-xl shadow-xl border border-gray-200 text-xs">
                <p className="font-bold text-gray-800 text-[10px] uppercase mb-1.5">
                    Paper Table 3 Risk Tiers
                </p>
                <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px]">
                    <div className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded bg-red-500 inline-block border border-red-600"></span>
                        <span className="font-medium">Imminent (&ge;0.75)</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded bg-orange-500 inline-block border border-orange-600"></span>
                        <span className="font-medium">High (0.60–0.75)</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded bg-yellow-500 inline-block border border-yellow-600"></span>
                        <span className="font-medium">Medium (0.35–0.60)</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded bg-green-500 inline-block border border-green-600"></span>
                        <span className="font-medium">Low (&lt;0.35)</span>
                    </div>
                </div>
                <div className="mt-1.5 pt-1.5 border-t border-gray-200 text-[10px] text-gray-500">
                    Auto-trigger alert & impassable barrier at <strong>risk &ge; 0.60</strong>
                </div>
            </div>

            <MapContainer
                center={center}
                zoom={zoom}
                style={{ height: '100%', width: '100%', zIndex: 0 }}
                scrollWheelZoom={true}
            >
                <UpdateView center={center} zoom={zoom} />
                <TileLayer
                    attribution='Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
                    url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                    maxZoom={19}
                />

                {/* 20x20 IDW Spatial Heatmap Grid */}
                {displayedPoints.map((point, idx) => {
                    const risk = point.risk_score ?? point.risk ?? 0.1;
                    const level = point.risk_level || getRiskLevel(risk);
                    const color = getRiskColor(risk);
                    const isImpassable = risk >= 0.60;

                    const bounds = [
                        [point.lat - CELL_SIZE, (point.lng ?? point.lon) - CELL_SIZE],
                        [point.lat + CELL_SIZE, (point.lng ?? point.lon) + CELL_SIZE]
                    ];

                    if (point.manual) {
                        return (
                            <Marker
                                key={point.id || idx}
                                position={[point.lat, point.lng ?? point.lon]}
                                icon={manualIcon}
                            >
                                <Popup>
                                    <div className="p-2 min-w-[200px]">
                                        <h4 className="font-bold text-purple-700 mb-1">Manual Test Cell</h4>
                                        <div className="space-y-1 text-xs">
                                            <div>Risk Score: <strong>{(risk * 100).toFixed(1)}%</strong></div>
                                            <div>Tier: <strong style={{ color }}>{level}</strong></div>
                                        </div>
                                    </div>
                                </Popup>
                            </Marker>
                        );
                    }

                    return (
                        <Rectangle
                            key={point.id || `cell_${idx}`}
                            bounds={bounds}
                            pathOptions={{
                                color: isImpassable ? '#b91c1c' : color,
                                fillColor: color,
                                fillOpacity: isImpassable ? 0.75 : 0.55,
                                weight: isImpassable ? 1.8 : 0.8,
                                dashArray: isImpassable ? '3, 3' : undefined,
                                opacity: 0.9
                            }}
                        >
                            <Popup>
                                <div className="p-2 min-w-[220px] font-sans">
                                    <div className="flex items-center justify-between border-b pb-1 mb-2">
                                        <h4 className="font-bold text-gray-900 text-sm">
                                            Cell [{point.row !== undefined ? `${point.row}, ${point.col}` : point.id}]
                                        </h4>
                                        <span
                                            className="px-2 py-0.5 rounded text-[10px] font-bold uppercase text-white"
                                            style={{ backgroundColor: color }}
                                        >
                                            {level}
                                        </span>
                                    </div>
                                    <div className="space-y-1 text-xs text-gray-700">
                                        <div className="flex justify-between">
                                            <span className="text-gray-500">Risk Score:</span>
                                            <span className="font-mono font-bold">{(risk * 100).toFixed(1)}%</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-500">Coordinates:</span>
                                            <span className="font-mono text-[11px]">{point.lat.toFixed(5)}, {(point.lng ?? point.lon).toFixed(5)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-500">Evacuation Status:</span>
                                            <span className={`font-bold ${isImpassable ? 'text-red-600' : 'text-green-600'}`}>
                                                {isImpassable ? '🚫 IMPASSABLE (Risk &ge; 0.60)' : '✅ PASSABLE ROUTE'}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-500">Interpolation:</span>
                                            <span className="font-mono">{point.sensorInfluence || '20x20 IDW'}</span>
                                        </div>
                                    </div>
                                </div>
                            </Popup>
                        </Rectangle>
                    );
                })}

                {/* Safe Mine Exits */}
                {showExits && SAFE_EXITS.map(gate => (
                    <Marker
                        key={gate.id}
                        position={[gate.lat, gate.lng]}
                        icon={exitIcon}
                    >
                        <Popup>
                            <div className="p-2 text-xs">
                                <h4 className="font-bold text-green-700 text-sm mb-1">🛡️ {gate.name}</h4>
                                <p className="text-gray-600">Designated A* Pathfinding Target Safe Exit</p>
                                <p className="text-gray-400 font-mono mt-1">{gate.lat.toFixed(4)}, {gate.lng.toFixed(4)}</p>
                            </div>
                        </Popup>
                    </Marker>
                ))}

                {/* Geotechnical Sensors */}
                {showSensors && GEOTECH_SENSORS.map(s => (
                    <Marker
                        key={s.id}
                        position={[s.lat, s.lng]}
                        icon={sensorIcon}
                    >
                        <Popup>
                            <div className="p-2 text-xs">
                                <h4 className="font-bold text-blue-700 text-sm mb-1">📡 {s.name}</h4>
                                <div className="space-y-0.5 text-gray-600">
                                    <div>Sensor ID: <span className="font-mono">{s.id}</span></div>
                                    <div>Calibration: <span className="font-mono">{s.factor}</span></div>
                                    <div>Status: <span className="font-bold text-green-600">{s.status}</span></div>
                                </div>
                            </div>
                        </Popup>
                    </Marker>
                ))}
            </MapContainer>
        </div>
    );
}
