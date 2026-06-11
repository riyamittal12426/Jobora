const JSEARCH_HOST = 'jsearch.p.rapidapi.com';
const BASE_URL = `https://${JSEARCH_HOST}/search`;

function getApiKey() {
  if (!process.env.RAPIDAPI_KEY) {
    throw new Error('RAPIDAPI_KEY is not configured on the server.');
  }
  return process.env.RAPIDAPI_KEY;
}

export function buildSearchQueries(resumeData) {
  const skills = (resumeData.foundSkills || []).slice(0, 5);
  const level = resumeData.experienceLevel || 'Mid';
  const skillStr = skills.length ? skills.join(' ') : 'software engineer';

  const roleQueries = [
    `${level} DevOps Engineer ${skillStr}`,
    `${level} Cloud Engineer AWS ${skillStr}`,
    `${level} Software Engineer ${skillStr}`,
    `${level} Full Stack Developer ${skillStr}`,
    `${level} Platform Engineer SRE ${skillStr}`,
  ];

  const extraRoles = ['Site Reliability Engineer', 'Backend Developer', 'Data Engineer'];
  extraRoles.forEach((role) => {
    if (skills.some((s) => role.toLowerCase().includes(s) || s.includes('aws') || s.includes('docker'))) {
      roleQueries.push(`${level} ${role} ${skillStr}`);
    }
  });

  return [...new Set(roleQueries)].slice(0, 5);
}

function normalizeJob(raw) {
  return {
    jobId: raw.job_id || raw.jobId || `${raw.employer_name}-${raw.job_title}`.replace(/\s+/g, '-'),
    title: raw.job_title || 'Unknown Role',
    company: raw.employer_name || 'Unknown Company',
    location: [raw.job_city, raw.job_state, raw.job_country].filter(Boolean).join(', ') || 'Remote',
    employmentType: raw.job_employment_type || 'Full-time',
    description: raw.job_description || '',
    applyLink: raw.job_apply_link || raw.job_google_link || '',
    salaryMin: raw.job_min_salary || null,
    salaryMax: raw.job_max_salary || null,
    salaryCurrency: raw.job_salary_currency || 'USD',
    postedAt: raw.job_posted_at_datetime_utc || null,
    isRemote: Boolean(raw.job_is_remote),
  };
}

export async function searchJobs(query, numPages = 1) {
  const params = new URLSearchParams({
    query: query.trim(),
    page: '1',
    num_pages: String(numPages),
    date_posted: 'month',
  });

  const response = await fetch(`${BASE_URL}?${params}`, {
    headers: {
      'X-RapidAPI-Key': getApiKey(),
      'X-RapidAPI-Host': JSEARCH_HOST,
    },
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`JSearch API error (${response.status}): ${errText.slice(0, 200)}`);
  }

  const data = await response.json();
  return (data.data || []).map(normalizeJob);
}

export async function fetchRecommendedJobs(resumeData, maxJobs = 12) {
  const queries = buildSearchQueries(resumeData);
  const seen = new Set();
  const jobs = [];

  for (const query of queries) {
    if (jobs.length >= maxJobs) break;
    try {
      const results = await searchJobs(query, 1);
      for (const job of results) {
        if (!seen.has(job.jobId) && job.description) {
          seen.add(job.jobId);
          jobs.push({ ...job, searchQuery: query });
        }
        if (jobs.length >= maxJobs) break;
      }
    } catch (err) {
      console.error(`JSearch query failed: ${query}`, err.message);
    }
  }

  return jobs;
}
