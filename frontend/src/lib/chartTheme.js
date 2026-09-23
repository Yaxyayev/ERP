import { useState, useEffect } from 'react';

export const NOTION_CHART_PALETTE = [
  '#3b82f6', // blue
  '#10b981', // emerald
  '#f59e0b', // amber
  '#8b5cf6', // purple
  '#06b6d4', // cyan
  '#ec4899', // rose
  '#6366f1', // indigo
];

export function getChartTheme() {
  const isDark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark');
  return {
    isDark,
    textColor: isDark ? '#9b9a97' : '#787671',
    dataTextColor: isDark ? '#e3e2de' : '#37352f',
    gridColor: isDark ? '#2e2d2b' : '#ede9e3',
    tooltipBg: isDark ? '#202020' : '#ffffff',
    tooltipBorder: isDark ? '#3b3a38' : '#ede9e3',
    tooltipText: isDark ? '#e3e2de' : '#37352f',
    tooltipStyle: {
      backgroundColor: isDark ? '#202020' : '#ffffff',
      borderColor: isDark ? '#3b3a38' : '#ede9e3',
      borderRadius: '8px',
      fontSize: '12px',
      color: isDark ? '#e3e2de' : '#37352f',
      boxShadow: isDark ? '0 8px 24px rgba(0,0,0,0.5)' : '0 8px 24px rgba(15,15,15,0.08)'
    },
    tooltipItemStyle: {
      color: isDark ? '#e3e2de' : '#37352f'
    },
    tooltipLabelStyle: {
      color: isDark ? '#e3e2de' : '#37352f',
      fontWeight: 600,
      marginBottom: '4px'
    }
  };
}

export function useChartTheme() {
  const [theme, setTheme] = useState(getChartTheme);

  useEffect(() => {
    const update = () => setTheme(getChartTheme());
    update();
    const observer = new MutationObserver(update);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  return theme;
}
