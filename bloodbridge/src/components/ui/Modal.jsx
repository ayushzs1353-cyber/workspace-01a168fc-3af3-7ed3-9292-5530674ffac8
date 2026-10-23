import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import Icon from '../Icon.jsx';
import Button from './Button.jsx';

export default function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
  icon = 'info',
  closeOnBackdrop = true,
  labelledBy,
}) {
  const reduce = useReducedMotion();
  const panelRef = useRef(null);
  const lastFocused = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    lastFocused.current = document.activeElement;
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKey = (event) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        onClose?.();
      }
      if (event.key === 'Tab' && panelRef.current) {
        const nodes = panelRef.current.querySelectorAll(
          'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        );
        if (!nodes.length) return;
        const first = nodes[0];
        const last = nodes[nodes.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener('keydown', onKey);

    const timer = window.setTimeout(() => {
      const target = panelRef.current?.querySelector(
        'input, select, textarea, button:not(.modal__close)',
      );
      target?.focus?.();
    }, 40);

    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = original;
      window.clearTimeout(timer);
      lastFocused.current?.focus?.();
    };
  }, [open, onClose]);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className="modal-backdrop"
          onMouseDown={(e) => {
            if (closeOnBackdrop && e.target === e.currentTarget) onClose?.();
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduce ? 0 : 0.16 }}
        >
          <motion.div
            ref={panelRef}
            className={`modal ${size === 'lg' ? 'modal--lg' : size === 'sm' ? 'modal--sm' : ''}`}
            role="dialog"
            aria-modal="true"
            aria-labelledby={labelledBy || 'modal-title'}
            initial={{ opacity: 0, y: reduce ? 0 : 12, scale: reduce ? 1 : 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: reduce ? 0 : 8, scale: reduce ? 1 : 0.99 }}
            transition={{ duration: reduce ? 0 : 0.2, ease: [0.22, 0.61, 0.36, 1] }}
          >
            <div className="modal__header">
              {icon && (
                <span className="modal__icon">
                  <Icon name={icon} className="icon" />
                </span>
              )}
              <div className="grow">
                <h2 className="modal__title" id="modal-title">
                  {title}
                </h2>
                {description && <p className="modal__desc">{description}</p>}
              </div>
              {onClose && (
                <button
                  type="button"
                  className="topbar__icon-btn modal__close"
                  onClick={onClose}
                  aria-label="Close dialog"
                >
                  <Icon name="x" />
                </button>
              )}
            </div>
            {children && <div className="modal__body">{children}</div>}
            {footer && <div className="modal__footer">{footer}</div>}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

export function ConfirmDialog({
  open,
  onCancel,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  tone = 'danger',
  icon = 'alert-triangle',
  children,
  loading,
}) {
  return (
    <Modal
      open={open}
      onClose={onCancel}
      title={title}
      description={description}
      size="sm"
      icon={icon}
      footer={
        <>
          <Button variant="secondary" onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button variant={tone} onClick={onConfirm} loading={loading}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      {children}
    </Modal>
  );
}
