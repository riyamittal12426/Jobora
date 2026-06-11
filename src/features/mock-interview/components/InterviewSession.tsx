import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Send, Loader2, ChevronRight, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import type { InterviewQuestion, InterviewSettings } from '@/types/interview';

interface InterviewSessionProps {
  question: InterviewQuestion;
  currentIndex: number;
  totalQuestions: number;
  settings: InterviewSettings;
  onSubmit: (answer: string) => Promise<void>;
  submitting: boolean;
}

export function InterviewSession({
  question,
  currentIndex,
  totalQuestions,
  settings,
  onSubmit,
  submitting,
}: InterviewSessionProps) {
  const [answer, setAnswer] = useState('');
  const progress = ((currentIndex) / totalQuestions) * 100;

  const handleSubmit = async () => {
    if (!answer.trim() || submitting) return;
    await onSubmit(answer.trim());
    setAnswer('');
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mx-auto max-w-3xl space-y-6">
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm text-gray-400">
          <span>Question {currentIndex + 1} of {totalQuestions}</span>
          <span>{settings.targetRole} · {settings.difficulty}</span>
        </div>
        <Progress value={progress} />
      </div>

      <Card className="overflow-hidden border-indigo-500/20">
        <CardHeader className="border-b border-gray-800 bg-gray-900/80">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="default">{question.category}</Badge>
            {question.focusArea && <Badge variant="outline">{question.focusArea}</Badge>}
          </div>
          <CardTitle className="mt-4 text-xl leading-relaxed text-white">{question.text}</CardTitle>
          {question.resumeReference && (
            <p className="mt-3 flex items-start gap-2 text-xs text-indigo-300/70">
              <BookOpen size={14} className="mt-0.5 shrink-0" />
              Based on your resume: {question.resumeReference}
            </p>
          )}
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
          <label className="flex items-center gap-2 text-sm font-medium text-gray-300">
            <Mic size={16} className="text-indigo-400" /> Your Answer
          </label>
          <textarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            disabled={submitting}
            placeholder="Type your answer as you would in a real interview. Be specific and reference your experience..."
            rows={8}
            className="w-full resize-none rounded-xl border border-gray-700 bg-gray-950/50 px-4 py-3 text-sm text-gray-100 placeholder:text-gray-600 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-60"
          />
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-500">{answer.length} characters · Scores revealed after interview</p>
            <Button onClick={handleSubmit} disabled={!answer.trim() || submitting}>
              {submitting ? (
                <><Loader2 size={16} className="animate-spin" /> Evaluating...</>
              ) : currentIndex + 1 >= totalQuestions ? (
                <><Send size={16} /> Finish Interview</>
              ) : (
                <><ChevronRight size={16} /> Submit & Next</>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <AnimatePresence>
        {submitting && (
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="text-center text-sm text-indigo-300/80"
          >
            AI interviewer is evaluating your response...
          </motion.p>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
