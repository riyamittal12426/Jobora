import { motion } from 'framer-motion';
import { History, Clock, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import type { InterviewHistoryItem } from '@/types/interview';

interface InterviewHistoryPanelProps {
  history: InterviewHistoryItem[];
  loading: boolean;
  onSelect: (id: string) => void;
}

export function InterviewHistoryPanel({ history, loading, onSelect }: InterviewHistoryPanelProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader><CardTitle className="text-base">Interview History</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full" />)}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <History size={18} className="text-indigo-400" /> Interview History
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {history.length === 0 ? (
          <p className="text-sm text-gray-500">No completed interviews yet.</p>
        ) : (
          history.map((item) => (
            <motion.button
              key={item._id}
              whileHover={{ scale: 1.01 }}
              onClick={() => onSelect(item._id)}
              className="flex w-full items-center justify-between rounded-xl border border-gray-800 bg-gray-950/40 p-4 text-left transition-colors hover:border-indigo-500/40 hover:bg-indigo-950/20"
            >
              <div>
                <p className="font-medium text-white">{item.settings.targetRole}</p>
                <p className="mt-1 flex items-center gap-2 text-xs text-gray-500">
                  <Clock size={12} />
                  {new Date(item.createdAt).toLocaleDateString()} · {item.settings.questionCount} questions
                </p>
                {item.finalReport && (
                  <Badge variant="default" className="mt-2">{item.finalReport.overallScore}/100</Badge>
                )}
              </div>
              <ChevronRight size={18} className="text-gray-500" />
            </motion.button>
          ))
        )}
      </CardContent>
    </Card>
  );
}
