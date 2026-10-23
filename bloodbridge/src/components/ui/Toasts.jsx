import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useApp } from '../../state/store.jsx';
import Icon from '../Icon.jsx';

const ICONS = { success: 'check-circle', error: 'alert-circle', info: 'info' };

export default function Toasts() {
  const { toasts, dismissToast } = useApp();
  const reduce = useReducedMotion();

  return (
    <div className="toast-region" role="status" aria-live="polite">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            className={`toast toast--${t.tone}`}
            initial={{ opacity: 0, x: reduce ? 0 : 24, y: reduce ? 0 : 8 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            exit={{ opacity: 0, x: reduce ? 0 : 16, scale: reduce ? 1 : 0.98 }}
            transition={{ duration: reduce ? 0 : 0.22, ease: [0.22, 0.61, 0.36, 1] }}
          >
            <Icon
              name={ICONS[t.tone] || 'info'}
              className="icon"
              style={{
                color:
                  t.tone === 'error'
                    ? 'var(--danger)'
                    : t.tone === 'info'
                      ? 'var(--info)'
                      : 'var(--success)',
                flexShrink: 0,
                marginTop: 1,
              }}
            />
            <div className="grow">
              <div className="toast__title">{t.title}</div>
              {t.message && <div className="toast__msg">{t.message}</div>}
            </div>
            <button
              type="button"
              className="toast__close"
              onClick={() => dismissToast(t.id)}
              aria-label="Dismiss notification"
            >
              <Icon name="x" className="icon icon--sm" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
