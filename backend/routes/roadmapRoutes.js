import express from 'express';
import ResumeAnalysis from '../models/ResumeAnalysis.js';
import JobRecommendationSession from '../models/JobRecommendationSession.js';
import CareerRoadmap from '../models/CareerRoadmap.js';
import { generatePersonalizedRoadmap } from '../services/roadmapService.js';
import Groq from 'groq-sdk';

const router = express.Router();

function getGroqClient() {
  if (!process.env.GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY is not configured on the server.');
  }
  return new Groq({ apiKey: process.env.GROQ_API_KEY });
}

// 1. Fetch Active Career Roadmap
router.get('/:email', async (req, res) => {
  try {
    const email = req.params.email;
    const roadmap = await CareerRoadmap.findOne({ userEmail: email });
    if (!roadmap) {
      return res.status(404).json({ message: 'No roadmap found. Please generate one to begin.' });
    }
    res.json(roadmap);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 2. Generate Personalized Roadmap
router.post('/:email/generate', async (req, res) => {
  try {
    const email = req.params.email;
    const { targetRole } = req.body;

    if (!targetRole) {
      return res.status(400).json({ message: 'Target role is required to generate a roadmap.' });
    }

    // Check if resume analysis is complete
    const resumeData = await ResumeAnalysis.findOne({ userEmail: email });
    if (!resumeData) {
      return res.status(400).json({ 
        message: 'Please complete your Resume Analysis before generating a career roadmap.' 
      });
    }

    // Fetch latest job session for market data if available (optional)
    const sessionData = await JobRecommendationSession.findOne({ userEmail: email })
      .sort({ createdAt: -1 });

    const roadmap = await generatePersonalizedRoadmap(resumeData, targetRole, sessionData);
    res.status(201).json(roadmap);
  } catch (error) {
    console.error('Roadmap generation error:', error);
    res.status(500).json({ message: error.message || 'Failed to generate career roadmap.' });
  }
});

// Helper: Calculate progress and check milestones
async function updateRoadmapProgress(roadmap) {
  const plans = roadmap.plans || {};
  let totalTasks = 0;
  const taskIds = new Set();

  ['immediate', 'shortTerm', 'midTerm', 'longTerm'].forEach(phase => {
    if (plans[phase] && Array.isArray(plans[phase].tasks)) {
      plans[phase].tasks.forEach(task => {
        if (task.id) {
          totalTasks++;
          taskIds.add(task.id);
        }
      });
    }
  });

  if (totalTasks === 0) {
    roadmap.currentProgress = 0;
    return;
  }

  // Filter completedTasks to make sure they are valid task IDs
  const validCompleted = (roadmap.completedTasks || []).filter(id => taskIds.has(id));
  roadmap.completedTasks = validCompleted;
  
  const progressPercent = Math.round((validCompleted.length / totalTasks) * 100);
  roadmap.currentProgress = progressPercent;

  // Update Milestones
  if (roadmap.milestones && Array.isArray(roadmap.milestones)) {
    roadmap.milestones.forEach(milestone => {
      if (progressPercent >= milestone.targetPercentage) {
        if (!milestone.unlocked) {
          milestone.unlocked = true;
          milestone.earnedAt = new Date();
        }
      } else {
        // Relock if progress dropped
        milestone.unlocked = false;
        milestone.earnedAt = undefined;
      }
    });
  }
}

// 3. Mark Task as Complete
router.post('/:email/complete-task', async (req, res) => {
  try {
    const email = req.params.email;
    const { taskId } = req.body;

    if (!taskId) {
      return res.status(400).json({ message: 'Task ID is required.' });
    }

    const roadmap = await CareerRoadmap.findOne({ userEmail: email });
    if (!roadmap) {
      return res.status(404).json({ message: 'Roadmap not found.' });
    }

    // Add to completed array if not already there
    if (!roadmap.completedTasks.includes(taskId)) {
      roadmap.completedTasks.push(taskId);
    }

    // Recalculate progress & milestones
    await updateRoadmapProgress(roadmap);

    await roadmap.save();
    res.json(roadmap);
  } catch (error) {
    console.error('Complete task error:', error);
    res.status(500).json({ message: error.message });
  }
});

// 4. Mark Task as Incomplete
router.post('/:email/uncomplete-task', async (req, res) => {
  try {
    const email = req.params.email;
    const { taskId } = req.body;

    if (!taskId) {
      return res.status(400).json({ message: 'Task ID is required.' });
    }

    const roadmap = await CareerRoadmap.findOne({ userEmail: email });
    if (!roadmap) {
      return res.status(404).json({ message: 'Roadmap not found.' });
    }

    // Remove from completed array
    roadmap.completedTasks = roadmap.completedTasks.filter(id => id !== taskId);

    // Recalculate progress & milestones
    await updateRoadmapProgress(roadmap);

    await roadmap.save();
    res.json(roadmap);
  } catch (error) {
    console.error('Uncomplete task error:', error);
    res.status(500).json({ message: error.message });
  }
});

// 5. Ask AI Career Coach / Technical Mentor
router.post('/:email/mentor-ask', async (req, res) => {
  try {
    const email = req.params.email;
    const { question } = req.body;

    if (!question || !question.trim()) {
      return res.status(400).json({ message: 'Question is required.' });
    }

    const roadmap = await CareerRoadmap.findOne({ userEmail: email });
    if (!roadmap) {
      return res.status(404).json({ message: 'Career roadmap is required to consult the AI Mentor.' });
    }

    const groq = getGroqClient();
    const systemPrompt = `You are the user's dedicated AI Career Coach and Technical Mentor.
They are working on a personalized career roadmap to become a "${roadmap.targetRole}".
Their experience level is "${roadmap.experienceLevel || 'Mid'}" and current progress is ${roadmap.currentProgress || 0}%.
Answer their query directly, helpfully, and with concrete steps.
Tone: Expert, encouraging, action-oriented, professional, and clear.
Use clean markdown to format code examples, suggestions, and study resources. Keep the answer focused and directly relevant.`;

    const userPrompt = `
USER ROADMAP INFO:
- Target Role: ${roadmap.targetRole}
- Current Skills: ${(roadmap.currentSkills || []).join(', ') || 'N/A'}
- Key Missing Skills: ${(roadmap.missingSkills || []).join(', ') || 'N/A'}
- AI Mentor Summary: ${roadmap.aiMentorSummary || 'N/A'}

USER QUESTION:
${question}
    `;

    console.log(`[Groq Mentor] Answering user question for user "${email}"...`);
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.5
    });

    const answer = completion.choices[0]?.message?.content || 'Sorry, I was unable to formulate an answer. Please try again.';
    res.json({ answer });
  } catch (error) {
    console.error('Mentor Q&A error:', error);
    res.status(500).json({ message: error.message || 'Error communicating with AI mentor.' });
  }
});

export default router;
