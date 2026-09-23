import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';

export function Modal({ isOpen, onClose, title, description, children, maxWidth = 'max-w-2xl' }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Notion Frosted Glass Backdrop */}
      <div
        className="fixed inset-0 notion-modal-backdrop transition-opacity cursor-pointer"
        onClick={onClose}
      />

      {/* Notion Glass Dialog Container with Spring Animation */}
      <div
        className={cn(
          'relative w-full rounded-xl notion-modal-glass text-charcoal dark:text-foreground my-8 max-h-[90vh] flex flex-col z-10 overflow-hidden',
          maxWidth
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-hairline/80 px-5 py-3.5 bg-white/40 dark:bg-white/5 backdrop-blur-sm">
          <div>
            {title && <h2 className="text-sm sm:text-base font-semibold tracking-tight text-charcoal dark:text-foreground">{title}</h2>}
            {description && (
              <p className="text-xs text-steel mt-0.5">{description}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-steel hover:bg-surface hover:text-charcoal dark:hover:text-foreground transition-colors shrink-0"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto px-5 py-4 flex-1">{children}</div>
      </div>
    </div>
  );
}
