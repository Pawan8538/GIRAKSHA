"use client";

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Rectangle, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { getRiskColor } from './HeatmapMap';

// Worker Icon (Pulsing amber/blue helmet reticle)
const createWorkerIcon = (isEvacuating) => L.divIcon({
    className: 'custom-worker-marker',
    html: `<div style="
        width: 32px;
        height: 32px;
        background: ${isEvacuating ? '#ef4444' : '#3b82f6'};
        border: 3px solid #ffffff;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 16px;
        box-shadow: 0 0 15px ${isEvacuating ? 'rgba(239, 68, 68, 0.9)' : 'rgba(59, 130, 246, 0.7)'};
        animation: pulse 1.5s infinite;
    ">
        👷
    </div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16]
});

// Exit Gate Icon
const createExitIcon = (isTarget) => L.divIcon({
    className: 'custom-exit-gate',
    html: `<div style="
        background: ${isTarget ? '#15803d' : '#16a34a'};
        color: white;
        border: ${isTarget ? '3px solid #facc15' : '2px solid white'};
        border-radius: 8px;
        padding: 4px 8px;
        font-size: 11px;
        font-weight: 800;
        display: flex;
        align-items: center;
        gap: 5px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.4);
        white-space: nowrap;
        transform: ${isTarget ? 'scale(1.15)' : 'scale(1)'};
        transition: transform 0.2s;
    ">
        <span>🛡️</span> ${isTarget ? '★ TARGET EXIT' : 'EXIT GATE'}
    </div>`,
    iconSize: [110, 28],
    iconAnchor: [55, 14]
});

// Map click handler to relocate worker
function MapClickHandler({ onGridClick, cellSize, originLat, originLon }) {
    useMapEvents({
        click(e) {
            const clickLat = e.latlng.lat;
            const clickLon = e.latlng.lng;
            const r = Math.round((clickLat - originLat) / cellSize);
            const c = Math.round((clickLon - originLon) / cellSize);
            if (r >= 0 && r < 20 && c >= 0 && c < 20) {
                onGridClick(r, c, clickLat, clickLon);
            }
        }
    });
    return null;
}

function CenterMap({ center, zoom }) {
    const map = useMap();
    useEffect(() => {
        if (center) {
            map.setView(center, zoom);
        }
    }, [center, zoom, map]);
    return null;
}

export default function EvacuationMapInner({
    grid = [],
    workerPos,
    targetExit,
    exits = [],
    pathCoordinates = [],
    isEvacuating = false,
    onMoveWorker,
    onSelectExit
}) {
    const center = [11.1053, 79.1506];
    const CELL_SIZE = 0.00014;
    const originLat = 11.1053 - 10 * (CELL_SIZE * 2);
    const originLon = 79.1506 - 10 * (CELL_SIZE * 2);

    return (
        <MapContainer
            center={center}
            zoom={16}
            style={{ width: '100%', height: '100%', zIndex: 0 }}
            scrollWheelZoom={true}
        >
            <CenterMap center={center} zoom={16} />
            <TileLayer
                attribution='Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
                url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                maxZoom={19}
            />

            <MapClickHandler
                cellSize={CELL_SIZE * 2}
                originLat={originLat}
                originLon={originLon}
                onGridClick={(r, c, lat, lon) => {
                    if (onMoveWorker) onMoveWorker(r, c, lat, lon);
                }}
            />

            {/* 20x20 Spatial Risk Grid Cells */}
            {grid.map((cell, idx) => {
                const risk = cell.risk_score ?? cell.risk ?? 0.1;
                const isImpassable = risk >= 0.60;
                const color = getRiskColor(risk);

                const bounds = [
                    [cell.lat - CELL_SIZE, (cell.lng ?? cell.lon) - CELL_SIZE],
                    [cell.lat + CELL_SIZE, (cell.lng ?? cell.lon) + CELL_SIZE]
                ];

                return (
                    <Rectangle
                        key={cell.id || `c_${idx}`}
                        bounds={bounds}
                        pathOptions={{
                            color: isImpassable ? '#b91c1c' : color,
                            fillColor: color,
                            fillOpacity: isImpassable ? 0.75 : 0.25,
                            weight: isImpassable ? 1.5 : 0.5,
                            dashArray: isImpassable ? '2, 3' : undefined
                        }}
                    >
                        <Popup>
                            <div className="p-2 text-xs">
                                <div className="font-bold text-gray-900 mb-1">
                                    Cell [{cell.row}, {cell.col}]
                                </div>
                                <div className="space-y-1">
                                    <div>Risk Score: <strong>{(risk * 100).toFixed(1)}%</strong></div>
                                    <div>Status: <strong className={isImpassable ? 'text-red-600' : 'text-green-600'}>
                                        {isImpassable ? '🚫 IMPASSABLE (A* Barrier)' : '✅ Walkable'}
                                    </strong></div>
                                </div>
                                {!isImpassable && (
                                    <button
                                        onClick={() => onMoveWorker && onMoveWorker(cell.row, cell.col, cell.lat, cell.lng ?? cell.lon)}
                                        className="mt-2 w-full px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-[11px] font-bold"
                                    >
                                        Place Worker Here
                                    </button>
                                )}
                            </div>
                        </Popup>
                    </Rectangle>
                );
            })}

            {/* Dynamic A* Evacuation Polyline (Safe green/yellow glowing route) */}
            {pathCoordinates.length > 1 && (
                <>
                    {/* Shadow / Glow line */}
                    <Polyline
                        positions={pathCoordinates}
                        pathOptions={{
                            color: '#15803d',
                            weight: 8,
                            opacity: 0.5
                        }}
                    />
                    {/* Primary Path line */}
                    <Polyline
                        positions={pathCoordinates}
                        pathOptions={{
                            color: '#4ade80',
                            weight: 4,
                            opacity: 0.95,
                            dashArray: isEvacuating ? '8, 8' : undefined
                        }}
                    />
                </>
            )}

            {/* Designated Safe Mine Exits */}
            {exits.map(gate => {
                const isTarget = targetExit?.id === gate.id;
                return (
                    <Marker
                        key={gate.id}
                        position={[gate.lat, gate.lng]}
                        icon={createExitIcon(isTarget)}
                        eventHandlers={{
                            click: () => onSelectExit && onSelectExit(gate)
                        }}
                    >
                        <Popup>
                            <div className="p-2 text-xs">
                                <h4 className="font-bold text-green-700">{gate.name}</h4>
                                <p className="text-gray-600 mt-0.5">Designated Safe Exit Shelter</p>
                                {isTarget && (
                                    <p className="mt-1 font-bold text-amber-600">★ Optimal Safe Destination</p>
                                )}
                            </div>
                        </Popup>
                    </Marker>
                );
            })}

            {/* Worker GPS Marker */}
            {workerPos && (
                <Marker
                    position={[workerPos.lat, workerPos.lon]}
                    icon={createWorkerIcon(isEvacuating)}
                >
                    <Popup>
                        <div className="p-2 text-xs">
                            <h4 className="font-bold text-blue-700">Worker 104 (GPS Live)</h4>
                            <p className="text-gray-600">Grid: [{workerPos.row}, {workerPos.col}]</p>
                            <p className="text-gray-500 font-mono text-[11px]">
                                {workerPos.lat.toFixed(5)}, {workerPos.lon.toFixed(5)}
                            </p>
                            <p className="mt-1 text-[11px] text-gray-500">
                                💡 Tip: Click anywhere on the map to relocate worker
                            </p>
                        </div>
                    </Popup>
                </Marker>
            )}
        </MapContainer>
    );
}
