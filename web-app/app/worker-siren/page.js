"use client";

import { useState, useEffect, useRef } from 'react';
import { AlertTriangle, Volume2, VolumeX } from 'lucide-react';
import api from '../../lib/api';

export default function WorkerSirenReceiver() {
    const [isMonitoring, setIsMonitoring] = useState(false);
    const [isAlertActive, setIsAlertActive] = useState(false);
    const [error, setError] = useState(null);
    const audioCtxRef = useRef(null);
    const oscillatorRef = useRef(null);
    const pollingRef = useRef(null);

    // Setup audio context on user interaction to bypass mobile browser limits
    const startMonitoring = () => {
        try {
            if (!audioCtxRef.current) {
                const AudioContext = window.AudioContext || window.webkitAudioContext;
                audioCtxRef.current = new AudioContext();
            }
            if (audioCtxRef.current.state === 'suspended') {
                audioCtxRef.current.resume();
            }
            setIsMonitoring(true);
            setError(null);
        } catch (err) {
            setError("Failed to initialize audio. Please ensure you are using a modern browser.");
            console.error(err);
        }
    };

    const stopMonitoring = () => {
        setIsMonitoring(false);
        stopBeep();
        if (pollingRef.current) {
            clearInterval(pollingRef.current);
            pollingRef.current = null;
        }
        setIsAlertActive(false);
    };

    const startBeep = () => {
        if (!audioCtxRef.current || oscillatorRef.current) return;
        
        const osc = audioCtxRef.current.createOscillator();
        const gainNode = audioCtxRef.current.createGain();
        
        osc.type = 'square';
        osc.frequency.setValueAtTime(800, audioCtxRef.current.currentTime); // 800Hz beep base
        
        // Create an oscillating volume for a "siren" effect
        gainNode.gain.setValueAtTime(1, audioCtxRef.current.currentTime);
        
        // Simple LFO for siren wail
        const lfo = audioCtxRef.current.createOscillator();
        lfo.type = 'sine';
        lfo.frequency.value = 2; // 2Hz pulse
        
        const lfoGain = audioCtxRef.current.createGain();
        lfoGain.gain.value = 500; // Sweep up and down 500Hz
        
        lfo.connect(lfoGain);
        lfoGain.connect(osc.frequency);
        
        osc.connect(gainNode);
        gainNode.connect(audioCtxRef.current.destination);
        
        osc.start();
        lfo.start();
        
        oscillatorRef.current = { osc, gainNode, lfo };
    };

    const stopBeep = () => {
        if (oscillatorRef.current) {
            try {
                oscillatorRef.current.osc.stop();
                oscillatorRef.current.lfo.stop();
                oscillatorRef.current.osc.disconnect();
            } catch (e) {}
            oscillatorRef.current = null;
        }
    };

    useEffect(() => {
        if (isMonitoring) {
            // Poll every 2 seconds
            pollingRef.current = setInterval(async () => {
                try {
                    const res = await api.get('/worker/siren/status');
                    if (res.data && res.data.active) {
                        setIsAlertActive(true);
                    } else {
                        setIsAlertActive(false);
                    }
                } catch (err) {
                    console.error("Polling error", err);
                }
            }, 2000);
        } else {
            if (pollingRef.current) clearInterval(pollingRef.current);
        }

        return () => {
            if (pollingRef.current) clearInterval(pollingRef.current);
            stopBeep();
        };
    }, [isMonitoring]);

    // Handle alert state changes
    useEffect(() => {
        if (isAlertActive) {
            startBeep();
        } else {
            stopBeep();
        }
    }, [isAlertActive]);

    return (
        <div className={`min-h-screen flex flex-col items-center justify-center p-6 transition-colors duration-300 ${isAlertActive ? 'bg-red-600' : 'bg-gray-100'}`}>
            <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl overflow-hidden text-center p-8">
                
                {isAlertActive ? (
                    <AlertTriangle className="w-24 h-24 text-red-600 mx-auto animate-pulse mb-6" />
                ) : (
                    <Volume2 className={`w-24 h-24 mx-auto mb-6 ${isMonitoring ? 'text-green-500 animate-pulse' : 'text-gray-300'}`} />
                )}

                <h1 className="text-3xl font-extrabold text-gray-900 mb-2">
                    {isAlertActive ? 'EVACUATE IMMEDIATELY' : 'Worker Siren Receiver'}
                </h1>
                
                <p className="text-gray-500 mb-8">
                    {isAlertActive 
                        ? 'A critical alert has been triggered by the local admin.' 
                        : isMonitoring 
                            ? 'Actively monitoring local hotspot for alerts...' 
                            : 'Click the button below to initialize the audio engine and start monitoring.'}
                </p>

                {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

                {!isMonitoring ? (
                    <button 
                        onClick={startMonitoring}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-6 rounded-xl text-xl shadow-lg transform transition active:scale-95"
                    >
                        Start Monitoring
                    </button>
                ) : (
                    <button 
                        onClick={stopMonitoring}
                        className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-4 px-6 rounded-xl shadow-inner transform transition active:scale-95 flex justify-center items-center gap-2"
                    >
                        <VolumeX className="w-5 h-5" /> Stop Monitoring
                    </button>
                )}

                {isAlertActive && (
                    <p className="mt-6 text-sm font-bold text-red-600 animate-bounce">
                        SIREN IS ACTIVE!
                    </p>
                )}
            </div>
            
            <p className={`mt-8 text-xs font-mono ${isAlertActive ? 'text-white' : 'text-gray-400'}`}>
                P2P Hotspot Protocol Active
            </p>
        </div>
    );
}
