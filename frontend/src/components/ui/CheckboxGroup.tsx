import { Check } from 'lucide-react';

interface CheckboxGroupProps {
    options: string[];
    selectedValues: string[];
    onChange: (values: string[]) => void;
    maxSelections?: number;
    columns?: number;
    label?: string;
    error?: string;
    helperText?: string;
}

export default function CheckboxGroup({
    options,
    selectedValues,
    onChange,
    maxSelections,
    columns = 2,
    label,
    error,
    helperText,
}: CheckboxGroupProps) {
    const handleToggle = (value: string) => {
        const isSelected = selectedValues.includes(value);
        if (isSelected) {
            onChange(selectedValues.filter((v) => v !== value));
        } else if (!maxSelections || selectedValues.length < maxSelections) {
            onChange([...selectedValues, value]);
        }
    };

    return (
        <div className="w-full">
            {label && (
                <label className="block text-sm font-medium text-slate-700 mb-2">
                    {label}
                </label>
            )}
            <div className={`grid grid-cols-1 sm:grid-cols-${columns} gap-3`}>
                {options.map((option) => {
                    const isSelected = selectedValues.includes(option);
                    const isDisabled = !!(maxSelections && selectedValues.length >= maxSelections && !isSelected);

                    return (
                        <label
                            key={option}
                            className={`
                flex items-center space-x-3 p-3 rounded-lg border cursor-pointer transition-all
                ${isSelected
                                    ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                                }
                ${isDisabled ? 'opacity-50 cursor-not-allowed hover:bg-transparent hover:border-slate-200' : ''}
              `}
                        >
                            <div className={`
                flex items-center justify-center w-5 h-5 rounded border transition-colors
                ${isSelected
                                    ? 'bg-primary border-primary text-white'
                                    : 'border-slate-300 bg-white'
                                }
              `}>
                                {isSelected && <Check size={12} strokeWidth={3} />}
                            </div>
                            <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => handleToggle(option)}
                                disabled={isDisabled}
                                className="hidden"
                            />
                            <span className="text-sm text-slate-700">{option}</span>
                        </label>
                    );
                })}
            </div>
            {error && (
                <p className="mt-1 text-sm text-red-500 animate-fadeIn">{error}</p>
            )}
            {helperText && !error && (
                <p className="mt-1 text-sm text-slate-500">{helperText}</p>
            )}
        </div>
    );
}
