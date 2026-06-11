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

// --- PRIMARY: JSearch API ---
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

// --- FALLBACK 1: Remotive (free, no auth) ---
function normalizeRemotiveJob(raw) {
  return {
    jobId: `remotive-${raw.id}`,
    title: raw.title || 'Unknown Role',
    company: raw.company_name || 'Unknown Company',
    location: raw.candidate_required_location || 'Remote',
    employmentType: raw.job_type === 'full_time' ? 'Full-time'
      : raw.job_type === 'contract' ? 'Contract'
      : raw.job_type === 'part_time' ? 'Part-time'
      : raw.job_type === 'internship' ? 'Internship'
      : 'Full-time',
    description: raw.description || '',
    applyLink: raw.url || '',
    salaryMin: null,
    salaryMax: null,
    salaryCurrency: 'USD',
    postedAt: raw.publication_date || null,
    isRemote: true,
  };
}

async function fetchRemotiveJobs(skills, maxJobs) {
  console.log('⚡ Falling back to Remotive API (free)...');
  try {
    // Remotive supports category-based search + keyword search
    const searchTerm = skills.length ? skills.slice(0, 3).join(' ') : 'developer';
    const response = await fetch(`https://remotive.com/api/remote-jobs?search=${encodeURIComponent(searchTerm)}&limit=${maxJobs}`);

    if (!response.ok) {
      throw new Error(`Remotive API error: ${response.status}`);
    }

    const data = await response.json();
    const jobs = (data.jobs || []).slice(0, maxJobs).map(normalizeRemotiveJob);
    console.log(`✅ Remotive returned ${jobs.length} jobs`);
    return jobs;
  } catch (err) {
    console.error('❌ Remotive fallback failed:', err.message);
    return [];
  }
}

// --- FALLBACK 2: Arbeitnow (free, no auth) ---
function normalizeArbeitnowJob(raw) {
  return {
    jobId: `arbeitnow-${raw.slug || raw.title}`.replace(/\s+/g, '-'),
    title: raw.title || 'Unknown Role',
    company: raw.company_name || 'Unknown Company',
    location: raw.location || 'Remote',
    employmentType: raw.remote ? 'Remote' : 'Full-time',
    description: raw.description || '',
    applyLink: raw.url || '',
    salaryMin: null,
    salaryMax: null,
    salaryCurrency: 'EUR',
    postedAt: raw.created_at ? new Date(raw.created_at * 1000).toISOString() : null,
    isRemote: Boolean(raw.remote),
  };
}

async function fetchArbeitnowJobs(skills, maxJobs) {
  console.log('⚡ Falling back to Arbeitnow API (free)...');
  try {
    const response = await fetch('https://www.arbeitnow.com/api/job-board-api');

    if (!response.ok) {
      throw new Error(`Arbeitnow API error: ${response.status}`);
    }

    const data = await response.json();
    const allJobs = (data.data || []).map(normalizeArbeitnowJob);

    // Filter jobs matching user skills
    const lowerSkills = skills.map(s => s.toLowerCase());
    let matched = allJobs.filter(job => {
      const text = `${job.title} ${job.description}`.toLowerCase();
      return lowerSkills.some(skill => text.includes(skill));
    });

    // If no skill-matched jobs, return the most recent ones
    if (matched.length === 0) matched = allJobs;
    const result = matched.slice(0, maxJobs);
    console.log(`✅ Arbeitnow returned ${result.length} jobs`);
    return result;
  } catch (err) {
    console.error('❌ Arbeitnow fallback failed:', err.message);
    return [];
  }
}

// --- MAIN ENTRY: try JSearch → Remotive → Arbeitnow ---
export async function fetchRecommendedJobs(resumeData, maxJobs = 12) {
  const skills = resumeData.foundSkills || [];

  // 1) Try JSearch (primary)
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

  if (jobs.length > 0) {
    console.log(`✅ JSearch returned ${jobs.length} jobs`);
    return jobs;
  }

  // 2) JSearch returned nothing — try Remotive
  console.log('⚠️ JSearch returned 0 jobs. Trying fallback APIs...');
  const remotiveJobs = await fetchRemotiveJobs(skills, maxJobs);
  if (remotiveJobs.length > 0) {
    return remotiveJobs.map(j => ({ ...j, searchQuery: 'remotive-fallback' }));
  }

  // 3) Remotive also failed — try Arbeitnow
  const arbeitnowJobs = await fetchArbeitnowJobs(skills, maxJobs);
  if (arbeitnowJobs.length > 0) {
    return arbeitnowJobs.map(j => ({ ...j, searchQuery: 'arbeitnow-fallback' }));
  }

  // All APIs failed
  console.error('❌ All job APIs failed. No jobs to return.');
  return [];
}
