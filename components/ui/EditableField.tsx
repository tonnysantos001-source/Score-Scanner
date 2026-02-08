interface EditableFieldProps {
    label: string;
    value: string | undefined;
    onChange?: (value: string) => void;
    editable?: boolean;
    readOnly?: boolean;
    multiline?: boolean;
    placeholder?: string;
}

export default function EditableField({
    label,
    value,
    onChange,
    editable = false,
    readOnly = false,
    multiline = false,
    placeholder = '',
}: EditableFieldProps) {
    const displayValue = value || 'Não informado';
    const isEditable = editable && !readOnly && onChange;

    return (
        <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
                {label}
            </label>

            {isEditable ? (
                multiline ? (
                    <textarea
                        value={value || ''}
                        onChange={(e) => onChange(e.target.value)}
                        placeholder={placeholder}
                        className="w-full px-3 py-2 bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-primary)] transition-all resize-none"
                        rows={3}
                    />
                ) : (
                    <input
                        type="text"
                        value={value || ''}
                        onChange={(e) => onChange(e.target.value)}
                        placeholder={placeholder}
                        className="w-full px-3 py-2 bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-primary)] transition-all"
                    />
                )
            ) : (
                <div className={`px-3 py-2 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-lg ${!value ? 'text-[var(--color-text-muted)] italic' : 'text-white font-semibold'
                    }`}>
                    {displayValue}
                </div>
            )}
        </div>
    );
}
