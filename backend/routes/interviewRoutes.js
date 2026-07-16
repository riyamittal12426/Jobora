import express from 'express';
import Interview from '../models/Interview.js';
import ResumeAnalysis from '../models/ResumeAnalysis.js';
import {
  generateInterviewQuestions,
  evaluateInterviewAnswer,
  generateFinalInterviewReport,
} from '../services/groqService.js';

const router = express.Router();

router.get('/resume-analysis/:email', async (req, res) => {
  try {
    const analysis = await ResumeAnalysis.findOne({ userEmail: req.params.email });
    if (!analysis) {
      return res.status(404).json({ message: 'No resume analysis found. Please analyze your resume first.' });
    }
    res.json(analysis);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/history/:email', async (req, res) => {
  try {
    const interviews = await Interview.find({
      userEmail: req.params.email,
      status: 'completed',
    })
      .sort({ createdAt: -1 })
      .select('-answers.evaluation.internalNotes')
      .limit(20);
    res.json(interviews);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const interview = await Interview.findById(req.params.id);
    if (!interview) return res.status(404).json({ message: 'Interview not found.' });

    const payload = interview.toObject();
    if (payload.status !== 'completed') {
      delete payload.finalReport;
      payload.answers = payload.answers.map(({ evaluation, ...rest }) => rest);
    }
    res.json(payload);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/start', async (req, res) => {
  try {
    const { userEmail, settings } = req.body;
    if (!userEmail || !settings?.questionCount || !settings?.targetRole) {
      return res.status(400).json({ message: 'Missing required interview settings.' });
    }

    const resumeData = await ResumeAnalysis.findOne({ userEmail });
    if (!resumeData) {
      return res.status(400).json({ message: 'Analyze your resume before starting a mock interview.' });
    }

    const interview = new Interview({
      userEmail,
      settings,
      resumeSnapshot: {
        foundSkills: resumeData.foundSkills,
        strengths: resumeData.strengths,
        weaknesses: resumeData.weaknesses,
        experienceLevel: resumeData.experienceLevel,
        resumeSummary: resumeData.resumeSummary,
        wordCount: resumeData.wordCount,
      },
      status: 'generating',
    });
    await interview.save();

    try {
      const questions = await generateInterviewQuestions(resumeData, settings);
      interview.questions = questions.map((q, i) => ({
        id: q.id || `q${i + 1}`,
        text: q.text,
        category: q.category,
        focusArea: q.focusArea,
        resumeReference: q.resumeReference,
        jdReference: q.jdReference,
      }));
      interview.status = 'in_progress';
      interview.currentQuestionIndex = 0;
      await interview.save();

      res.status(201).json({
        interviewId: interview._id,
        totalQuestions: interview.questions.length,
        currentIndex: 0,
        question: interview.questions[0],
      });
    } catch (genError) {
      interview.status = 'failed';
      interview.errorMessage = genError.message;
      await interview.save();
      throw genError;
    }
  } catch (error) {
    console.error('Interview start error:', error);
    res.status(500).json({ message: error.message || 'Failed to start interview.' });
  }
});

router.post('/:id/answer', async (req, res) => {
  try {
    const { answer } = req.body;
    if (!answer?.trim()) {
      return res.status(400).json({ message: 'Answer cannot be empty.' });
    }

    const interview = await Interview.findById(req.params.id);
    if (!interview) return res.status(404).json({ message: 'Interview not found.' });
    if (interview.status !== 'in_progress') {
      return res.status(400).json({ message: 'Interview is not active.' });
    }

    const index = interview.currentQuestionIndex;
    const question = interview.questions[index];
    if (!question) return res.status(400).json({ message: 'No active question.' });

    const resumeData = await ResumeAnalysis.findOne({ userEmail: interview.userEmail });
    const evaluation = await evaluateInterviewAnswer(
      resumeData,
      interview.settings,
      question,
      answer.trim()
    );

    interview.answers.push({
      questionIndex: index,
      question: question.text,
      questionCategory: question.category,
      focusArea: question.focusArea,
      answer: answer.trim(),
      evaluation,
    });

    const isLastQuestion = index + 1 >= interview.questions.length;
    if (isLastQuestion) {
      interview.status = 'evaluating';
      interview.currentQuestionIndex = index + 1;
      await interview.save();

      const finalReport = await generateFinalInterviewReport(
        resumeData,
        interview.settings,
        interview.answers
      );

      interview.finalReport = finalReport;
      interview.status = 'completed';
      await interview.save();

      return res.json({
        completed: true,
        interviewId: interview._id,
        finalReport,
      });
    }

    interview.currentQuestionIndex = index + 1;
    await interview.save();

    res.json({
      completed: false,
      currentIndex: interview.currentQuestionIndex,
      totalQuestions: interview.questions.length,
      question: interview.questions[interview.currentQuestionIndex],
    });
  } catch (error) {
    console.error('Answer evaluation error:', error);
    res.status(500).json({ message: error.message || 'Failed to evaluate answer.' });
  }
});

export default router;
