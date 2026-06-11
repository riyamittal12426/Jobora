import { motion } from 'framer-motion';
import {
  Trophy, TrendingUp, AlertTriangle, CheckCircle2, BookOpen,
  Target, MessageSquare, Brain, Shield, BarChart3, RotateCcw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CircularScore } from './CircularScore';
import type { FinalInterviewReport, InterviewSettings } from '@/types/interview';

interface ResultsDashboardProps {
  report: FinalInterviewReport;
  settings: InterviewSettings;
  onRetry: () => void;
  onBack: () => void;
}

const readinessVariant = (level: string) => {
  if (level === 'Excellent') return 'success';
  if (level === 'Good') return 'default';
  if (level === 'Average') return 'warning';
  return 'danger';
};

export function ResultsDashboard({ report, settings, onRetry, onBack }: ResultsDashboardProps) {
  const categoryScores = [
    { label: 'Technical', score: report.technicalScore, color: 'text-blue-400', stroke: 'text-blue-500' },
    { label: 'Communication', score: report.communicationScore, color: 'text-green-400', stroke: 'text-green-500' },
    { label: 'Problem Solving', score: report.problemSolvingScore, color: 'text-purple-400', stroke: 'text-purple-500' },
    { label: 'Confidence', score: report.confidenceScore, color: 'text-yellow-400', stroke: 'text-yellow-500' },
    { label: 'Resume Fit', score: report.resumeAlignmentScore, color: 'text-indigo-400', stroke: 'text-indigo-500' },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mx-auto max-w-6xl space-y-8 pb-12">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <Badge variant={readinessVariant(report.interviewReadinessLevel)} className="mb-3">
            {report.interviewReadinessLevel}
          </Badge>
          <h1 className="text-3xl font-bold font-[font2] text-white">Interview Assessment Report</h1>
          <p className="mt-2 text-gray-400">{settings.targetRole} · {settings.interviewType} · {settings.difficulty}</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={onBack}>Back to Setup</Button>
          <Button onClick={onRetry}><RotateCcw size={16} /> Retry Interview</Button>
        </div>
      </div>

      <Card className="border-indigo-500/30 bg-gradient-to-r from-indigo-950/40 to-purple-950/20">
        <CardContent className="flex flex-col items-center gap-6 p-8 md:flex-row md:justify-around">
          <CircularScore score={report.overallScore} label="Overall Score" colorClass="text-indigo-300" strokeColor="text-indigo-500" size={120} />
          <div className="max-w-md text-center md:text-left">
            <div className="mb-2 flex items-center justify-center gap-2 md:justify-start">
              <Trophy className="text-yellow-400" size={22} />
              <span className="text-lg font-bold text-white">{report.readinessPercentage}% Interview Ready</span>
            </div>
            <p className="text-sm leading-relaxed text-indigo-100/80">{report.aiFeedbackSummary}</p>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
        {categoryScores.map((cat) => (
          <Card key={cat.label} className="flex justify-center p-4">
            <CircularScore score={cat.score} label={cat.label} colorClass={cat.color} strokeColor={cat.stroke} size={88} />
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-400"><CheckCircle2 size={18} /> Strengths</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {report.strengths.map((s, i) => (
                <li key={i} className="flex gap-2 text-sm text-gray-300"><span className="text-green-500">•</span>{s}</li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-400"><AlertTriangle size={18} /> Weaknesses</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {report.weaknesses.map((w, i) => (
                <li key={i} className="flex gap-2 text-sm text-gray-300"><span className="text-red-500">•</span>{w}</li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-400"><TrendingUp size={18} /> Improvement Areas</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {report.improvementAreas.map((area, i) => (
              <Badge key={i} variant="warning">{area}</Badge>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-400"><Target size={18} /> Missing Skills</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {report.missingSkills.map((skill, i) => (
              <Badge key={i} variant="danger">{skill}</Badge>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><MessageSquare size={18} className="text-indigo-400" /> Recruiter Feedback</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-relaxed text-gray-300">{report.recruiterFeedback}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Brain size={18} className="text-purple-400" /> Role Fit Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-relaxed text-gray-300">{report.roleFitAnalysis}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><BookOpen size={18} className="text-blue-400" /> Personalized Learning Roadmap</CardTitle>
          <CardDescription>Recommended path based on your interview performance</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {report.learningRoadmap.map((item, i) => (
            <div key={i} className="rounded-xl border border-gray-800 bg-gray-950/40 p-4">
              <div className="mb-2 flex items-center justify-between">
                <h4 className="font-semibold text-white">{item.topic}</h4>
                <Badge variant={item.priority === 'High' ? 'danger' : item.priority === 'Medium' ? 'warning' : 'outline'}>
                  {item.priority}
                </Badge>
              </div>
              <p className="text-sm text-gray-400">{item.resources}</p>
              <p className="mt-2 text-xs text-indigo-300/70">Timeline: {item.timeline}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><BarChart3 size={18} className="text-indigo-400" /> Question-by-Question Breakdown</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {report.questionBreakdown.map((item) => (
            <div key={item.questionIndex} className="rounded-xl border border-gray-800 p-5">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <Badge variant="outline">Q{item.questionIndex + 1}</Badge>
                <span className="text-sm font-bold text-indigo-300">Score: {item.overallQuestionScore}/100</span>
              </div>
              <p className="mb-2 font-medium text-white">{item.question}</p>
              <p className="mb-4 text-sm text-gray-400 italic">Your answer: {item.answer}</p>

              <div className="mb-4 grid grid-cols-2 gap-2 md:grid-cols-3">
                {Object.entries(item.scores).filter(([k]) => k !== 'internalNotes').map(([key, val]) => (
                  <div key={key} className="rounded-lg bg-gray-900/60 p-2">
                    <p className="text-xs capitalize text-gray-500">{key.replace(/([A-Z])/g, ' $1')}</p>
                    <Progress value={(val as number) * 10} className="mt-1 h-1.5" />
                    <p className="mt-1 text-xs text-gray-300">{val}/10</p>
                  </div>
                ))}
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-lg bg-green-950/20 p-3 text-sm text-green-200/90">
                  <strong className="text-green-400">Good: </strong>{item.whatWasGood}
                </div>
                <div className="rounded-lg bg-red-950/20 p-3 text-sm text-red-200/90">
                  <strong className="text-red-400">Missing: </strong>{item.whatWasMissing}
                </div>
              </div>
              <div className="mt-3 rounded-lg border border-indigo-900/40 bg-indigo-950/20 p-3 text-sm text-indigo-100/90">
                <strong className="text-indigo-400">Ideal answer: </strong>{item.idealAnswerExample}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
        <Shield size={14} /> Powered by Groq AI · Senior Interviewer Simulation
      </div>
    </motion.div>
  );
}
