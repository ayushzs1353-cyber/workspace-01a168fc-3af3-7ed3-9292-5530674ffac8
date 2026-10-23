import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';

export default function Dropdown({ trigger, children, align = 'right', wide = false }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const reduce = useReducedMotion();

  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div className="dropdown" ref={ref}>
      {trigger({ open, toggle: () => setOpen((o) => !o) })}
      <AnimatePresence>
        {open && (
          <motion.div
            className={`dropdown__menu ${wide ? 'dropdown__menu--wide' : ''}`}
            style={align === 'left' ? { left: 0, right: 'auto' } : undefined}
            initial={{ opacity: 0, y: reduce ? 0 : -6, scale: reduce ? 1 : 0.99 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: reduce ? 0 : -4 }}
            transition={{ duration: reduce ? 0 : 0.15, ease: [0.22, 0.61, 0.36, 1] }}
            onClick={() => setOpen(false)}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
