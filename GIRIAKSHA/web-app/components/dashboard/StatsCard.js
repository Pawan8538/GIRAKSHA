import { Card } from '../common/Card';
import { clsx } from 'clsx';
import { ArrowUp, ArrowDown, Minus } from 'lucide-react';

export default function StatsCard({
    title,
    value,
    icon: Icon,
    trend, // { value: number, label: string, direction: 'up' | 'down' | 'neutral' }
    color = 'blue',
    loading = false
}) {
    const colorStyles = {
        blue: { bg: 'bg-blue-50', text: 'text-blue-600' },
        green: { bg: 'bg-green-50', text: 'text-green-600' },
        purple: { bg: 'bg-purple-50', text: 'text-purple-600' },
        orange: { bg: 'bg-orange-50', text: 'text-orange-600' },
        red: { bg: 'bg-red-50', text: 'text-red-600' },
    };

    const style = colorStyles[color] || colorStyles.blue;

    if (loading) {
        return (
            <Card className="p-6 animate-pulse">
                <div className="flex justify-between items-start">
                    <div className="space-y-3 w-full">
                        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                        <div className="h-8 bg-gray-200 rounded w-3/4"></div>
                    </div>
                    <div className="h-12 w-12 bg-gray-200 rounded-lg"></div>
                </div>
            </Card>
        );
    }

    return (
        <Card className="p-6">
            <div className="flex justify-between items-start">
                <div>
                    <p className="text-sm font-medium text-gray-500">{title}</p>
                    <h3 className="text-2xl font-bold text-gray-900 mt-2">{value}</h3>

                    {trend && (
                        <div className="flex items-center mt-2 text-xs">
                            <span className={clsx(
                                "flex items-center font-medium",
                                trend.direction === 'up' && "text-green-600",
                                trend.direction === 'down' && "text-red-600",
                                trend.direction === 'neutral' && "text-gray-500"
                            )}>
                                {trend.direction === 'up' && <ArrowUp className="w-3 h-3 mr-1" />}
                                {trend.direction === 'down' && <ArrowDown className="w-3 h-3 mr-1" />}
                                {trend.direction === 'neutral' && <Minus className="w-3 h-3 mr-1" />}
                                {Math.abs(trend.value)}{trend.unit !== undefined ? trend.unit : '%'}
                            </span>
                            <span className="text-gray-400 ml-1.5">{trend.label}</span>
                        </div>
                    )}
                </div>

                <div className={clsx("p-3 rounded-xl", style.bg)}>
                    <Icon className={clsx("w-6 h-6", style.text)} />
                </div>
            </div>
        </Card>
    );
}
