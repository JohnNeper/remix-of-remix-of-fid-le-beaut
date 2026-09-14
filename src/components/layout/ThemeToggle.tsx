import React from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';
import { Sun, Moon, Laptop } from 'lucide-react';
import { cn } from '@/lib/utils';

export function ThemeToggle({ className, compact = false }: { className?: string; compact?: boolean }) {
  const { theme, setTheme } = useTheme();

  const cycleTheme = () => {
    if (theme === 'light') setTheme('dark');
    else if (theme === 'dark') setTheme('system');
    else setTheme('light');
  };

  if (compact) {
    return (
      <Button
        variant="ghost"
        size="sm"
        title={`Thème: ${theme}`}
        className={cn(
          'h-8 w-8 p-0 rounded-xl bg-background/60 hover:bg-background text-foreground shadow-xs border border-border/40 transition-all active:scale-95 flex items-center justify-center',
          className
        )}
        onClick={cycleTheme}
      >
        {theme === 'dark' ? (
          <Moon className="h-4 w-4 text-rose-400" />
        ) : theme === 'light' ? (
          <Sun className="h-4 w-4 text-amber-500" />
        ) : (
          <Laptop className="h-4 w-4 text-slate-400" />
        )}
        <span className="sr-only">Changer de thème</span>
      </Button>
    );
  }

  return (
    <div className={cn('flex items-center bg-muted/80 backdrop-blur-md rounded-lg p-0.5 border border-border/50', className)}>
      <Button
        variant="ghost"
        size="sm"
        title="Mode clair"
        className={cn(
          'h-7 w-7 p-0 rounded-md transition-all',
          theme === 'light' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
        )}
        onClick={() => setTheme('light')}
      >
        <Sun className="h-3.5 w-3.5 text-amber-500" />
        <span className="sr-only">Clair</span>
      </Button>

      <Button
        variant="ghost"
        size="sm"
        title="Mode sombre"
        className={cn(
          'h-7 w-7 p-0 rounded-md transition-all',
          theme === 'dark' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
        )}
        onClick={() => setTheme('dark')}
      >
        <Moon className="h-3.5 w-3.5 text-rose-400" />
        <span className="sr-only">Sombre</span>
      </Button>

      <Button
        variant="ghost"
        size="sm"
        title="Système"
        className={cn(
          'h-7 w-7 p-0 rounded-md transition-all',
          theme === 'system' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
        )}
        onClick={() => setTheme('system')}
      >
        <Laptop className="h-3.5 w-3.5" />
        <span className="sr-only">Système</span>
      </Button>
    </div>
  );
}
