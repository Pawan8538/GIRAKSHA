import { twMerge } from 'tailwind-merge';

const riskConfig = {
    low: {
        color: '#22c55e',
        label: 'Low Risk',
        bgColor: 'rgba(34, 197, 94, 0.1)'
    },
    medium: {
        color: '#eab308',
        label: 'Medium Risk',
        bgColor: 'rgba(234, 179, 8, 0.1)'
    },
    high: {
        color: '#f97316',
        label: 'High Risk',
        bgColor: 'rgba(249, 115, 22, 0.1)'
    },
    imminent: {
        color: '#ef4444',
        label: 'Imminent',
        bgColor: 'rgba(239, 68, 68, 0.1)'
    },
    // Backwards compatibility alias for critical
    critical: {
        color: '#ef4444',
        label: 'Imminent',
        bgColor: 'rgba(239, 68, 68, 0.1)'
    }
};

export default function RiskBadge({ level = 'low', score, className }) {
    const config = riskConfig[level?.toLowerCase()] || riskConfig.low;

    return (
        <span
            className={twMerge('risk-badge', className)}
            style={{
                color: config.color,
                backgroundColor: config.bgColor,
                borderColor: config.color
            }}
        >
            {config.label} {score !== undefined && `(${Math.round(score * 100)}%)`}
        </span>
    );
}
