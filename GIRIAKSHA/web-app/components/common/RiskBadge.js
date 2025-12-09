import { twMerge } from 'tailwind-merge';

const riskConfig = {
    low: {
        color: '#10b981',
        label: 'Low Risk',
        bgColor: 'rgba(16, 185, 129, 0.1)'
    },
    medium: {
        color: '#f59e0b',
        label: 'Medium Risk',
        bgColor: 'rgba(245, 158, 11, 0.1)'
    },
    high: {
        color: '#ef4444',
        label: 'High Risk',
        bgColor: 'rgba(239, 68, 68, 0.1)'
    },
    imminent: {
        color: '#7f1d1d',
        label: 'Imminent',
        bgColor: 'rgba(127, 29, 29, 0.1)'
    },
    critical: {
        color: '#000000',
        label: 'Critical',
        bgColor: 'rgba(0, 0, 0, 0.1)'
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
