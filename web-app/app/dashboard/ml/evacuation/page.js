"use client";

import { useState, useEffect } from 'react';
import CreateAlertModal from '../../../../components/alerts/CreateAlertModal';
import api from '../../../../lib/api';

export default function EvacuationPage() {
    const [showAlertModal, setShowAlertModal] = useState(false);

    useEffect(() => {
        const handleMessage = (event) => {
            if (event.data && event.data.type === 'TRIGGER_EVACUATION_ALERT') {
                setShowAlertModal(true);
            } else if (event.data && event.data.type === 'CANCEL_EVACUATION_ALERT') {
                api.post('/worker/siren/reset').catch(err => console.error(err));
            }
        };
        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, []);

    return (
        <div className="w-full" style={{ height: 'calc(100vh - 100px)' }}>
            <iframe 
                src="/test_demo.html" 
                style={{ width: '100%', height: '100%', border: 'none', borderRadius: '12px' }}
                title="Evacuation Map Demo"
            />
            <CreateAlertModal
                isOpen={showAlertModal}
                onClose={() => setShowAlertModal(false)}
                onSuccess={() => { console.log('Alert Triggered Successfully'); }}
            />
        </div>
    );
}
