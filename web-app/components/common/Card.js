import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function Card({ children, className, ...props }) {
    return (
        <div
            className={twMerge('card bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden', className)}
            {...props}
        >
            {children}
        </div>
    );
}

export function CardHeader({ children, className, ...props }) {
    return (
        <div
            className={twMerge('px-6 py-4 border-b border-gray-100', className)}
            {...props}
        >
            {children}
        </div>
    );
}

export function CardTitle({ children, className, ...props }) {
    return (
        <h3
            className={twMerge('text-lg font-semibold text-gray-900', className)}
            {...props}
        >
            {children}
        </h3>
    );
}

export function CardContent({ children, className, ...props }) {
    return (
        <div className={twMerge('p-6', className)} {...props}>
            {children}
        </div>
    );
}

export function CardFooter({ children, className, ...props }) {
    return (
        <div
            className={twMerge('px-6 py-4 bg-gray-50 border-t border-gray-100', className)}
            {...props}
        >
            {children}
        </div>
    );
}
