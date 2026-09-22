import React, { createContext, useContext } from 'react';
import { cn } from '../../lib/utils';

const TabsContext = createContext({
  value: '',
  onValueChange: () => {}
});

export function Tabs({ value, onValueChange, defaultValue, className, children, ...props }) {
  const [currentValue, setCurrentValue] = React.useState(defaultValue || value || '');

  const activeValue = value !== undefined ? value : currentValue;
  const handleValueChange = onValueChange || setCurrentValue;

  return (
    <TabsContext.Provider value={{ value: activeValue, onValueChange: handleValueChange }}>
      <div className={cn('w-full', className)} {...props}>
        {children}
      </div>
    </TabsContext.Provider>
  );
}

export function TabsList({ className, ...props }) {
  return (
    <div
      className={cn(
        'inline-flex h-9 items-center justify-center rounded-xl bg-zinc-100 dark:bg-zinc-800 p-1 text-muted-foreground',
        className
      )}
      {...props}
    />
  );
}

export function TabsTrigger({ value, className, children, ...props }) {
  const { value: activeValue, onValueChange } = useContext(TabsContext);
  const isActive = activeValue === value;

  return (
    <button
      type="button"
      role="tab"
      aria-selected={isActive}
      onClick={() => onValueChange(value)}
      className={cn(
        'inline-flex items-center justify-center whitespace-nowrap rounded-lg px-3 py-1 text-xs font-medium transition-all focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50',
        isActive
          ? 'bg-background text-foreground shadow-sm font-semibold'
          : 'text-muted-foreground hover:text-foreground',
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function TabsContent({ value, className, children, ...props }) {
  const { value: activeValue } = useContext(TabsContext);
  if (activeValue !== value) return null;

  return (
    <div
      role="tabpanel"
      className={cn('mt-2 animate-in fade-in-50 duration-150', className)}
      {...props}
    >
      {children}
    </div>
  );
}
