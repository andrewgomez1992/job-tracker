import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import clsx from 'clsx';
import styles from './Modal.module.css';

/**
 * A dialog on desktop, a bottom sheet on phones. Handles Escape, focus, body
 * scroll locking and a click-outside close.
 */
export function Modal({ open, onClose, title, description, width, footer, children, bodyFlush = false }) {
  const panelRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;

    const onKeyDown = (event) => { if (event.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKeyDown);

    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';

    const timer = setTimeout(() => {
      const focusable = panelRef.current?.querySelector(
        'input:not([type="hidden"]), textarea, select, button:not([data-skip-autofocus])',
      );
      focusable?.focus();
    }, 60);

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = overflow;
      clearTimeout(timer);
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div
      className={styles.backdrop}
      onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}
      role="presentation"
    >
      <div
        ref={panelRef}
        className={styles.panel}
        style={width ? { '--modal-width': width } : undefined}
        role="dialog"
        aria-modal="true"
        aria-label={typeof title === 'string' ? title : undefined}
      >
        <div className={styles.grabber} aria-hidden />
        {title && (
          <div className={styles.header}>
            <div>
              <div className={styles.title}>{title}</div>
              {description && <div className={styles.description}>{description}</div>}
            </div>
            <button type="button" className={styles.close} onClick={onClose} aria-label="Close" data-skip-autofocus>
              <X size={17} />
            </button>
          </div>
        )}
        <div className={bodyFlush ? styles.bodyFlush : styles.body}>{children}</div>
        {footer && <div className={clsx(styles.footer, footer.props?.spread && styles.footerSpread)}>{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}

export const ModalFooter = ({ children }) => <>{children}</>;
