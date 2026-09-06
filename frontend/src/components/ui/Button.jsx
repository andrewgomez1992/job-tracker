import clsx from 'clsx';
import styles from './Button.module.css';

/**
 * variant: primary | secondary | ghost | soft | danger
 * size: sm | md | lg
 */
export function Button({
  variant = 'secondary', size = 'md', block = false, iconOnly = false,
  loading = false, icon: Icon, children, className, disabled, ...props
}) {
  return (
    <button
      type="button"
      className={clsx(
        styles.button, styles[variant], size !== 'md' && styles[size],
        block && styles.block, iconOnly && styles.iconOnly, className,
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <span className={styles.spinner} aria-hidden />
        : Icon ? <Icon size={size === 'sm' ? 14 : 16} strokeWidth={2} aria-hidden /> : null}
      {children}
    </button>
  );
}

export function IconButton({ label, ...props }) {
  return <Button iconOnly variant="ghost" aria-label={label} title={label} {...props} />;
}
