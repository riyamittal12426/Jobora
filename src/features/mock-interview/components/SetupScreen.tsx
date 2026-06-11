import { motion } from 'framer-motion';
import { Settings2, Target, Layers, Hash, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { InterviewSettings, ResumeAnalysisData } from '@/types/interview';
import {
  DIFFICULTY_OPTIONS,
  INTERVIEW_TYPES,
  QUESTION_COUNT_OPTIONS,
  TARGET_ROLES,
} from '@/types/interview';

interface SetupScreenProps {
  resumeData: ResumeAnalysisData;
  settings: InterviewSettings;
  onChange: (settings: InterviewSettings) => void;
  onStart: () => void;
  loading?: boolean;
}

export function SetupScreen({ resumeData, settings, onChange, onStart, loading }: SetupScreenProps) {
  const set = <K extends keyof InterviewSettings>(key: K, value: InterviewSettings[K]) =>
    onChange({ ...settings, [key]: value });

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-4xl space-y-8">
      <div className="text-center">
        <Badge variant="default" className="mb-4 px-4 py-1">Resume-Powered Interview</Badge>
        <h1 className="text-3xl font-bold font-[font2] text-white md:text-4xl">Configure Your Mock Interview</h1>
        <p className="mt-3 text-gray-400">Questions will be generated from your resume skills, projects, and experience.</p>
      </div>

      <Card className="border-indigo-500/20 bg-gradient-to-br from-indigo-950/30 to-gray-900/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-indigo-200">
            <Sparkles size={20} className="text-indigo-400" /> Resume Profile Loaded
          </CardTitle>
          <CardDescription>{resumeData.resumeSummary || 'Your analyzed resume is ready for personalized questions.'}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">{resumeData.experienceLevel} Level</Badge>
            {(resumeData.foundSkills || []).slice(0, 8).map((skill) => (
              <Badge key={skill} variant="default">{skill}</Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base"><Hash size={18} className="text-indigo-400" /> Questions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {QUESTION_COUNT_OPTIONS.map((count) => (
                <Button
                  key={count}
                  variant={settings.questionCount === count ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => set('questionCount', count)}
                >
                  {count}
                </Button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-400">Custom:</span>
              <input
                type="number"
                min={3}
                max={25}
                value={settings.questionCount}
                onChange={(e) => set('questionCount', Math.min(25, Math.max(3, Number(e.target.value) || 5)))}
                className="w-20 rounded-lg border border-gray-700 bg-gray-800 px-3 py-1.5 text-sm text-white"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base"><Layers size={18} className="text-purple-400" /> Difficulty</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {DIFFICULTY_OPTIONS.map((d) => (
              <Button key={d} variant={settings.difficulty === d ? 'default' : 'outline'} size="sm" onClick={() => set('difficulty', d)}>
                {d}
              </Button>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base"><Settings2 size={18} className="text-blue-400" /> Interview Type</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {INTERVIEW_TYPES.map((t) => (
              <Button key={t} variant={settings.interviewType === t ? 'default' : 'outline'} size="sm" onClick={() => set('interviewType', t)}>
                {t}
              </Button>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base"><Target size={18} className="text-green-400" /> Target Role</CardTitle>
          </CardHeader>
          <CardContent>
            <select
              value={settings.targetRole}
              onChange={(e) => set('targetRole', e.target.value)}
              className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-sm text-white focus:border-indigo-500 focus:outline-none"
            >
              {TARGET_ROLES.map((role) => (
                <option key={role} value={role}>{role}</option>
              ))}
            </select>
          </CardContent>
        </Card>
      </div>

      <Button size="lg" className="w-full" onClick={onStart} disabled={loading}>
        {loading ? 'Generating personalized questions...' : 'Start Interview'}
      </Button>
    </motion.div>
  );
}
