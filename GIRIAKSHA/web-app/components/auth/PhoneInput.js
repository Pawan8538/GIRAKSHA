import { forwardRef } from 'react';
import { twMerge } from 'tailwind-merge';

export const PhoneInput = forwardRef(({ className, label, error, ...props }, ref) => {
    return (
        <div className="w-full">
            {/* Label */}
            {label && (
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    {label}
                </label>
            )}

            {/* Input */}
            <input
                ref={ref}
                type="tel"
                className={twMerge(
                    'input w-full rounded-md border border-gray-300 px-3 py-2 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent transition-shadow disabled:cursor-not-allowed disabled:opacity-50',
                    error && 'border-red-500 focus:ring-red-500',
                    className
                )}
                placeholder="9876543210"
                maxLength={10}
                pattern="[0-9]{10}"
                onInput={(e) => {
                    // Allow only numbers
                    e.target.value = e.target.value.replace(/[^0-9]/g, '');
                }}
                {...props}
            />

            {/* Error Message */}
            {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
        </div>
    );
});

PhoneInput.displayName = 'PhoneInput';
