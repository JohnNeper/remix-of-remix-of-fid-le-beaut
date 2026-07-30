import React from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';
import { Sun, Moon, Laptop } from 'lucide-react';
import { cn } from '@/lib/utils';

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();

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
