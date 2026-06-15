import { chatJson, FAST_MODEL } from './jobGroqService.js';
import LearningResource from '../models/LearningResource.js';

export async function searchAndCategorizeResources(skill) {
  const normalizedSkill = skill.trim().toLowerCase();
  
  // 1. Check if resource already exists in cache
  try {
    const cached = await LearningResource.findOne({ skill: normalizedSkill });
    if (cached) {
      console.log(`[Cache Hit] Learning resources for "${normalizedSkill}" found in MongoDB.`);
      return cached.toObject();
    }
  } catch (err) {
    console.error(`Error querying LearningResource cache for "${normalizedSkill}":`, err);
  }

  // 2. Fetch from Tavily if cache miss
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) {
    console.warn('TAVILY_API_KEY is not set. Generating fallback resources.');
    const fallbacks = getFallbackResources(normalizedSkill);
    await saveToCache(normalizedSkill, fallbacks);
    return fallbacks;
  }

  const query = `best learning resources for ${skill} developer: official documentation, free courses, youtube tutorials, practice labs, hands-on projects, certifications, interview questions`;

  try {
    console.log(`[Tavily Search] Querying resources for "${normalizedSkill}"...`);
    const response = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        api_key: apiKey,
        query: query,
        search_depth: 'basic',
        max_results: 8
      })
    });

    if (!response.ok) {
      throw new Error(`Tavily search API error: ${response.statusText}`);
    }

    const data = await response.json();
    const searchResults = data.results || [];

    const systemPrompt = `You are an expert technical resource curator.
Categorize the provided search results into exactly the following 7 categories of learning links:
- officialDocumentation
- freeCourses
- youtubeTutorials
- practiceLabs
- projects
- certifications
- interviewPrep

Each category must be an array of objects: { title, url, snippet }.
Rules:
- Categorize the search results carefully into these buckets.
- If there are no results or too few results for a category, use your own expert knowledge to generate 1-2 standard, high-quality links for that category (e.g. docs.aws.amazon.com for AWS, or famous youtube tutorials, freecodecamp, github repos, or reputable certification courses on Coursera/Udemy/Pluralsight).
- Ensure every category has at least 1-2 valid, functional links.
- Return ONLY valid JSON matching this exact structure:
{
  "officialDocumentation": [{"title": "...", "url": "...", "snippet": "..."}],
  "freeCourses": [...],
  "youtubeTutorials": [...],
  "practiceLabs": [...],
  "projects": [...],
  "certifications": [...],
  "interviewPrep": [...]
}`;

    const userPrompt = `
SKILL: ${skill}
SEARCH RESULTS:
${JSON.stringify(searchResults, null, 2)}
    `;

    console.log(`[Groq FAST_MODEL] Categorizing links for "${normalizedSkill}"...`);
    const categorized = await chatJson(systemPrompt, userPrompt, FAST_MODEL, 0.2);
    
    // Save to Cache
    await saveToCache(normalizedSkill, categorized);
    return categorized;
  } catch (error) {
    console.error(`Error searching resources for ${skill}:`, error);
    const fallbacks = getFallbackResources(normalizedSkill);
    await saveToCache(normalizedSkill, fallbacks);
    return fallbacks;
  }
}

async function saveToCache(skill, resources) {
  try {
    await LearningResource.findOneAndUpdate(
      { skill },
      { $set: resources },
      { upsert: true, new: true }
    );
    console.log(`[Cache Store] Successfully saved resources for "${skill}" to MongoDB.`);
  } catch (err) {
    console.error(`Error saving resources for "${skill}" to cache:`, err);
  }
}

function getFallbackResources(skill) {
  const capitalized = skill.charAt(0).toUpperCase() + skill.slice(1);
  return {
    officialDocumentation: [
      { 
        title: `${capitalized} Official Documentation`, 
        url: `https://www.google.com/search?q=${encodeURIComponent(skill + ' official documentation')}`, 
        snippet: `Access official documentation, quickstart guides, and developer references for ${capitalized}.` 
      }
    ],
    freeCourses: [
      { 
        title: `Learn ${capitalized} - freeCodeCamp Course`, 
        url: `https://www.youtube.com/results?search_query=${encodeURIComponent(skill + ' freecodecamp')}`, 
        snippet: `Free, comprehensive video courses and certifications for ${capitalized}.` 
      }
    ],
    youtubeTutorials: [
      { 
        title: `${capitalized} Beginner Crash Course`, 
        url: `https://www.youtube.com/results?search_query=${encodeURIComponent(skill + ' crash course')}`, 
        snippet: `A curated list of YouTube tutorials to help you get started with ${capitalized}.` 
      }
    ],
    practiceLabs: [
      { 
        title: `Interactive ${capitalized} Coding Labs`, 
        url: `https://github.com/search?q=${encodeURIComponent(skill + ' exercises')}`, 
        snippet: `Interactive online code challenges, labs, and interactive tutorials for ${capitalized}.` 
      }
    ],
    projects: [
      { 
        title: `GitHub Projects on ${capitalized}`, 
        url: `https://github.com/search?q=${encodeURIComponent(skill + ' beginner projects')}`, 
        snippet: `Hands-on sample projects and repositories built using ${capitalized} for portfolio building.` 
      }
    ],
    certifications: [
      { 
        title: `${capitalized} Certificate Study Guides`, 
        url: `https://www.google.com/search?q=${encodeURIComponent(skill + ' certification roadmap')}`, 
        snippet: `Top certification courses and study guides to prove your proficiency in ${capitalized}.` 
      }
    ],
    interviewPrep: [
      { 
        title: `${capitalized} Interview Q&A Cheatsheet`, 
        url: `https://www.google.com/search?q=${encodeURIComponent(skill + ' interview questions')}`, 
        snippet: `Common interview preparation questions, technical drills, and conceptual answers for ${capitalized}.` 
      }
    ]
  };
}
