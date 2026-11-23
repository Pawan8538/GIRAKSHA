"use client";

import { useState } from 'react';
import EvacuationMap from '../../../../components/ml/EvacuationMap';
import CreateAlertModal from '../../../../components/alerts/CreateAlertModal';

export default function EvacuationPage() {
    const [showAlertModal, setShowAlertModal] = useState(false);

    return (
        <div className="w-full pb-8">
            <EvacuationMap />

            <CreateAlertModal
                isOpen={showAlertModal}
                onClose={() => setShowAlertModal(false)}
                onSuccess={() => { console.log('Evacuation alert dispatched'); }}
            />
        </div>
    );
}
