import React, { useEffect, useRef, useState } from 'react';
import { Terminal, Scroll, ShieldAlert } from 'lucide-react';
import type { AutomationLog } from '@/types/automation';

interface AutomationLogViewerProps {
  logs: AutomationLog[];
  heightClass?: string;
}

export default function AutomationLogViewer({ logs, heightClass = 'h-64' }: AutomationLogViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);

  useEffect(() => {
    if (autoScroll && containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [logs, autoScroll]);

  const handleScroll = () => {
    if (!containerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    // If user scrolled up by more than 15px from bottom, turn off auto-scroll
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 15;
    setAutoScroll(isAtBottom);
  };

  const getLogLevelClass = (level: string) => {
    switch (level) {
      case 'success':
        return 'text-green-400 font-bold';
      case 'warn':
        return 'text-amber-400 font-medium';
      case 'error':
        return 'text-red-400 font-bold';
      case 'info':
      default:
        return 'text-cyan-400';
    }
  };

  return (
    <div className="bg-zinc-950/80 backdrop-blur-xl border border-white/10 rounded-xl overflow-hidden font-mono shadow-2xl">
      {/* Header */}
      <div className="bg-white/5 px-4 py-2 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-2 text-zinc-400 text-xs">
          <Terminal size={14} className="text-violet-400" />
          <span>Automation Console logs</span>
        </div>
        <button
          onClick={() => setAutoScroll(prev => !prev)}
          className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider transition-all border ${
            autoScroll
              ? 'bg-violet-500/10 border-violet-500/30 text-violet-300'
              : 'bg-white/5 border-white/10 text-zinc-400'
          }`}
        >
          <Scroll size={10} />
          <span>{autoScroll ? 'Auto-Scroll' : 'Locked'}</span>
        </button>
      </div>

      {/* Logs Body */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className={`p-4 overflow-y-auto space-y-1.5 text-xs select-text leading-relaxed ${heightClass}`}
      >
        {logs.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-zinc-500 text-center gap-2">
            <Terminal size={24} className="opacity-30" />
            <p>Waiting for automation process logs...</p>
          </div>
        ) : (
          logs.map((log, index) => {
            const timeString = new Date(log.timestamp).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit'
            });
            return (
              <div key={index} className="flex items-start gap-2 border-b border-white/[0.02] pb-1">
                <span className="text-zinc-600 shrink-0">{timeString}</span>
                <span className={`${getLogLevelClass(log.level)} shrink-0`}>
                  [{log.level.toUpperCase()}]
                </span>
                <span className="text-zinc-300 break-all">{log.message}</span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
