/**
 * Building blocks for forms: a labelled field with an inline error,
 * and a labelled dropdown built from a list of options.
 */

/**
 * Label + any input + optional validation message.
 * Errors use role="alert" so screen readers announce them.
 */
export function Field({ label, error, children }) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
      {error && <em role="alert">{error}</em>}
    </label>
  );
}

/**
 * Field wrapping a <select>.
 *
 * Props:
 *   options  – list of strings to choose from
 *   isOptionDisabled – optional: (option) => true to grey an option out
 *   value    – currently selected option
 *   onChange – standard change handler
 */
export function SelectField({ label, options, value, onChange, error, isOptionDisabled }) {
  return (
    <Field label={label} error={error}>
      <select value={value} onChange={onChange}>
        {options.map((option) => {
          const disabled = Boolean(isOptionDisabled?.(option));

          return (
            <option key={option} value={option} disabled={disabled}>
              {option}
              {disabled ? ' 🔒' : ''}
            </option>
          );
        })}
      </select>
    </Field>
  );
}