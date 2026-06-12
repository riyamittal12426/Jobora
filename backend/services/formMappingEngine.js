/**
 * Form Mapping Engine
 * Maps detected form field labels to candidate profile data using
 * keyword dictionaries, fuzzy matching, and AI-assisted classification.
 */

// ─── Keyword Dictionaries ───────────────────────────────────────────
const FIELD_MAPS = {
  first_name: ['first name', 'first_name', 'firstname', 'given name', 'prenom', 'nombre'],
  last_name: ['last name', 'last_name', 'lastname', 'surname', 'family name', 'nom'],
  full_name: ['full name', 'name', 'your name', 'applicant name', 'candidate name'],
  email: ['email', 'email address', 'e-mail', 'your email', 'contact email'],
  phone: ['phone', 'phone number', 'mobile', 'telephone', 'contact number', 'cell', 'mobile number', 'tel'],
  linkedin: ['linkedin', 'linkedin url', 'linkedin profile', 'linkedin profile url'],
  github: ['github', 'github url', 'github profile', 'github profile url'],
  portfolio: ['portfolio', 'portfolio url', 'website', 'personal website', 'personal url', 'your website'],
  resume: ['resume', 'cv', 'curriculum vitae', 'upload resume', 'resume/cv', 'attach resume', 'upload cv'],
  cover_letter: ['cover letter', 'motivation letter', 'cover', 'cover letter upload', 'letter of motivation'],
  location: ['location', 'city', 'address', 'current location', 'where are you located'],
  current_company: ['current company', 'company', 'organization', 'employer', 'current employer', 'org'],
  current_title: ['current title', 'job title', 'current role', 'title', 'current position'],
  years_experience: ['years of experience', 'experience', 'total experience', 'work experience', 'how many years'],
  education: ['education', 'school', 'university', 'degree', 'highest education', 'qualification'],
  salary: ['salary', 'compensation', 'expected salary', 'desired salary', 'salary expectation', 'salary requirements'],
  notice_period: ['notice period', 'availability', 'start date', 'earliest start', 'when can you start', 'available from'],
  work_authorization: ['work authorization', 'authorized to work', 'visa status', 'sponsorship', 'legally authorized',
    'require sponsorship', 'work permit', 'eligible to work', 'visa sponsorship'],
  gender: ['gender', 'sex', 'gender identity'],
  veteran: ['veteran', 'veteran status', 'military', 'protected veteran'],
  disability: ['disability', 'disability status', 'disabled'],
  race_ethnicity: ['race', 'ethnicity', 'race/ethnicity', 'demographic'],
  referral: ['referral', 'how did you hear', 'source', 'referred by'],
};

// ─── Levenshtein Distance ───────────────────────────────────────────
function levenshtein(a, b) {
  const matrix = Array.from({ length: b.length + 1 }, (_, i) => [i]);
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      matrix[i][j] = b[i - 1] === a[j - 1]
        ? matrix[i - 1][j - 1]
        : Math.min(matrix[i - 1][j - 1] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j] + 1);
    }
  }
  return matrix[b.length][a.length];
}

function fuzzyScore(label, keyword) {
  const dist = levenshtein(label, keyword);
  const maxLen = Math.max(label.length, keyword.length);
  return maxLen === 0 ? 1 : 1 - dist / maxLen;
}

// ─── Main Classification ────────────────────────────────────────────
/**
 * Classify a form field label into a known field key.
 * Returns { key, confidence } or null if no match found.
 */
export function classifyField(rawLabel, fieldType) {
  if (!rawLabel) return null;
  const label = rawLabel.toLowerCase().replace(/[*:]/g, '').trim();

  // File inputs → resume or cover letter
  if (fieldType === 'file') {
    for (const kw of FIELD_MAPS.cover_letter) {
      if (label.includes(kw)) return { key: 'cover_letter', confidence: 95 };
    }
    return { key: 'resume', confidence: 90 };
  }

  // Exact substring match first
  for (const [key, keywords] of Object.entries(FIELD_MAPS)) {
    for (const kw of keywords) {
      if (label === kw || label.includes(kw)) {
        return { key, confidence: 95 };
      }
    }
  }

  // Fuzzy match with threshold
  let bestKey = null;
  let bestScore = 0;
  for (const [key, keywords] of Object.entries(FIELD_MAPS)) {
    for (const kw of keywords) {
      const score = fuzzyScore(label, kw);
      if (score > bestScore && score >= 0.7) {
        bestScore = score;
        bestKey = key;
      }
    }
  }

  if (bestKey) {
    return { key: bestKey, confidence: Math.round(bestScore * 100) };
  }

  return null; // Unrecognized → will be treated as custom question
}

// ─── Profile Value Resolver ─────────────────────────────────────────
/**
 * Given a classified field key and candidate profile, return the value to fill.
 */
export function resolveValue(fieldKey, profile) {
  if (!profile) return '';

  const fullName = profile.name || '';
  const nameParts = fullName.split(' ');
  const firstName = nameParts[0] || '';
  const lastName = nameParts.slice(1).join(' ') || '';

  const education0 = (profile.education || [])[0] || {};
  const experience0 = (profile.experience || [])[0] || {};

  const map = {
    first_name: firstName,
    last_name: lastName,
    full_name: fullName,
    email: profile.email || '',
    phone: profile.phone || '',
    linkedin: profile.linkedinUrl || '',
    github: profile.githubUrl || '',
    portfolio: profile.portfolioUrl || '',
    location: '', // Fill from user data if available
    current_company: experience0.company || '',
    current_title: experience0.role || '',
    years_experience: String((profile.experience || []).length || ''),
    education: education0.school ? `${education0.degree || ''} — ${education0.school}` : '',
    salary: '', // Defer to AI or leave blank
    notice_period: 'Immediate',
    work_authorization: 'Yes',
    gender: '',
    veteran: '',
    disability: '',
    race_ethnicity: '',
    referral: '',
    resume: profile.resumeUrl || '',
    cover_letter: '',
  };

  return map[fieldKey] ?? '';
}

// ─── Full Mapping Pipeline ──────────────────────────────────────────
/**
 * Map an array of detected form fields to profile values.
 * Returns an enriched array with mappedKey, mappedValue, and confidence.
 * Unrecognized fields are flagged as custom questions.
 */
export function mapFieldsToProfile(detectedFields, profile) {
  return detectedFields.map(field => {
    const classification = classifyField(field.label || field.placeholder || field.name, field.type);

    if (classification) {
      return {
        ...field,
        mappedKey: classification.key,
        mappedValue: resolveValue(classification.key, profile),
        confidence: classification.confidence,
        isCustomQuestion: false
      };
    }

    return {
      ...field,
      mappedKey: null,
      mappedValue: '',
      confidence: 0,
      isCustomQuestion: true
    };
  });
}
