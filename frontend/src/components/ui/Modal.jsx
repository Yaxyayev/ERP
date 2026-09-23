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
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-[2px] transition-opacity animate-in fade-in"
        onClick={onClose}
      />

      {/* Notion Dialog Container */}
      <div
        className={cn(
          'relative w-full rounded-lg bg-card border border-hairline text-card-foreground shadow-notion-modal transition-all animate-in zoom-in-95 my-8 max-h-[90vh] flex flex-col',
          maxWidth
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-hairline px-5 py-3.5">
          <div>
            {title && <h2 className="text-sm sm:text-base font-semibold tracking-tight text-foreground">{title}</h2>}
            {description && (
              <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-muted-foreground hover:bg-surface hover:text-foreground transition-colors"
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
