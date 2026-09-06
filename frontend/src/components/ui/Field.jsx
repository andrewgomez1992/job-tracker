import { useId } from 'react';
import { ChevronDown } from 'lucide-react';
import clsx from 'clsx';
import styles from './Field.module.css';

export function Field({ label, optional, hint, error, children, htmlFor }) {
  return (
    <div className={styles.field}>
      {label && (
        <label className={styles.label} htmlFor={htmlFor}>
          {label}
          {optional && <span className={styles.optional}>optional</span>}
        </label>
      )}
      {children}
      {error ? <div className={styles.error}>{error}</div>
        : hint ? <div className={styles.hint}>{hint}</div> : null}
    </div>
  );
}

export function Input({ label, optional, hint, error, className, ...props }) {
  const id = useId();
  return (
    <Field label={label} optional={optional} hint={hint} error={error} htmlFor={id}>
      <input id={id} className={clsx(styles.control, error && styles.invalid, className)} {...props} />
    </Field>
  );
}

export function Textarea({ label, optional, hint, error, className, ...props }) {
  const id = useId();
  return (
    <Field label={label} optional={optional} hint={hint} error={error} htmlFor={id}>
      <textarea id={id} className={clsx(styles.control, styles.textarea, error && styles.invalid, className)} {...props} />
    </Field>
  );
}

/** options: [{ value, label }] */
export function Select({ label, optional, hint, error, options = [], placeholder, className, ...props }) {
  const id = useId();
  return (
    <Field label={label} optional={optional} hint={hint} error={error} htmlFor={id}>
      <div className={styles.selectWrap}>
        <select id={id} className={clsx(styles.control, styles.select, error && styles.invalid, className)} {...props}>
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
        <ChevronDown size={15} className={styles.chevron} aria-hidden />
      </div>
    </Field>
  );
}

export const FieldRow = ({ children }) => <div className={styles.row}>{children}</div>;

/** Quick-pick chips that write into a text input. */
export const SuggestionChips = ({ options, value, onSelect }) => (
  <div className={styles.chips}>
    {options.map((option) => (
      <button
        key={option}
        type="button"
        className={clsx(styles.chip, value === option && styles.chipActive)}
        onClick={() => onSelect(value === option ? '' : option)}
      >
        {option}
      </button>
    ))}
  </div>
);
