"use client";

import { MapContainer, TileLayer, CircleMarker, Marker, Popup, useMap, Rectangle } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect } from 'react';

// Fix for Leaflet default icon issues in Next.js
import L from 'leaflet';

// Create custom icon for manual predictions (Blue)
const manualIcon = L.divIcon({
    className: 'custom-manual-marker',
    html: `<div style="
        width: 24px;
        height: 24px;
        background: #3b82f6;
        border: 3px solid #fff;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        box-shadow: 0 3px 10px rgba(59, 130, 246, 0.4);
        animation: pulse 2s infinite;
    "></div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 24]
});

const HeatmapMap = ({ points = [], center = [11.1053, 79.1506], zoom = 16 }) => {

    const UpdateView = ({ center, zoom }) => {
        const map = useMap();
        useEffect(() => {
            map.setView(center, zoom);
        }, [center, zoom, map]);
        return null;
    };

    const getColor = (risk) => {
        // Match fusion engine risk levels
        if (risk >= 0.75) return '#8B4513'; // Brown (Imminent)
        if (risk >= 0.5) return '#f97316'; // Orange (High)
        if (risk >= 0.25) return '#eab308'; // Yellow (Medium)
        if (risk >= 0.2) return '#22c55e'; // Green (Low)
        return '#3b82f6'; // Blue (Safe)
    };

    const getRiskLevel = (risk) => {
        if (risk >= 0.75) return 'Imminent';
        if (risk >= 0.5) return 'High';
        if (risk >= 0.25) return 'Medium';
        if (risk >= 0.2) return 'Low';
        return 'Safe';
    };

    return (
        <>
            <style jsx global>{`
                @keyframes pulse {
                    0%, 100% { transform: rotate(-45deg) scale(1); }
                    50% { transform: rotate(-45deg) scale(1.1); }
                }
            `}</style>
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

                {points.map((point, idx) => {
                    if (point.manual) {
                        return (
                            <Marker
                                key={point.id || idx}
                                position={[point.lat, point.lng]}
                                icon={manualIcon}
                            >
                                <Popup>
                                    <div className="p-2 min-w-[220px]">
                                        <h4 className="font-bold text-blue-700 mb-2 flex items-center gap-2">
                                            <span className="inline-block w-3 h-3 bg-blue-500 rounded-sm transform rotate-45"></span>
                                            Manual Test Data
                                        </h4>
                                        <div className="space-y-1 text-sm">
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Risk Level:</span>
                                                <span className="font-semibold" style={{ color: getColor(point.risk_score) }}>
                                                    {getRiskLevel(point.risk_score)}
                                                </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Risk Score:</span>
                                                <span className="font-semibold">{(point.risk_score * 100).toFixed(1)}%</span>
                                            </div>
                                        </div>
                                        <p className="text-xs text-blue-700 mt-2 border-t border-blue-200 pt-1 font-semibold">
                                            ⚠️ Test prediction from manual input
                                        </p>
                                    </div>
                                </Popup>
                            </Marker>
                        );
                    } else {
                        // Automated sensor data marker - SQUARE GRID
                        // Define cell size (approx 30m)
                        const CELL_SIZE = 0.00025;
                        const bounds = [
                            [point.lat - CELL_SIZE, point.lng - CELL_SIZE],
                            [point.lat + CELL_SIZE, point.lng + CELL_SIZE]
                        ];

                        return (
                            <Rectangle
                                key={point.id || idx}
                                bounds={bounds}
                                pathOptions={{
                                    color: getColor(point.risk),
                                    fillColor: getColor(point.risk),
                                    fillOpacity: 0.6,
                                    weight: 1,
                                    opacity: 0.8
                                }}
                            >
                                <Popup>
                                    <div className="p-2 min-w-[200px]">
                                        <h4 className="font-bold text-gray-900 mb-2">Cell {point.id}</h4>
                                        <div className="space-y-1 text-sm">
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Risk Level:</span>
                                                <span className="font-semibold" style={{ color: getColor(point.risk) }}>
                                                    {getRiskLevel(point.risk)}
                                                </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Risk Score:</span>
                                                <span className="font-semibold">{(point.risk * 100).toFixed(1)}%</span>
                                            </div>
                                        </div>
                                        <p className="text-xs text-gray-500 mt-2 border-t pt-1">Live grid cell data</p>
                                    </div>
                                </Popup>
                            </Rectangle>
                        );
                    }
                })}
            </MapContainer>
        </>
    );
};

export default HeatmapMap;
