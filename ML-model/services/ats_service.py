"""
Enterprise-Grade ATS Parsing Engine & Executive Career Strategist
=================================================================
Analyzes raw resume text (potentially from Tesseract OCR),
reconstructs its logical structure despite OCR noise,
and evaluates rigorously against a target Job Role, Industry,
and optional Job Description — aided by RAG industry benchmarks.

Evaluation Dimensions:
  - Keyword & Semantic Alignment (30%)
  - Impact & Quantification (30%)
  - Role & Seniority Fit (25%)
  - Structural & Clarity Index (15%)
"""

import os
import re
import json
from typing import Optional, List, Dict
from dotenv import load_dotenv

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")

try:
    import google.generativeai as genai
    if GEMINI_API_KEY:
        genai.configure(api_key=GEMINI_API_KEY)
except ImportError:
    genai = None

from services.rag_service import RAGService


# ---------------------------------------------------------------------------
# Industry-specific keyword banks (used for heuristic fallback)
# ---------------------------------------------------------------------------
INDUSTRY_KEYWORDS: Dict[str, List[str]] = {
    "technology": [
        "typescript", "react", "node.js", "express", "postgresql", "sql", "git",
        "docker", "ci/cd", "aws", "clean architecture", "unit testing", "rest api",
        "microservices", "redis", "agile", "mongodb", "python", "fastapi", "graphql",
        "kubernetes", "terraform", "system design", "scalability",
    ],
    "finance": [
        "financial modeling", "valuation", "roi", "risk management", "compliance",
        "bloomberg", "excel", "python", "sql", "portfolio management", "derivatives",
        "fintech", "regulatory", "audit", "budgeting", "forecasting", "cfa",
    ],
    "healthcare": [
        "clinical", "hipaa", "ehr", "patient outcomes", "medical devices",
        "fda", "gcp", "clinical trials", "pharmacovigilance", "healthcare it",
        "telemedicine", "nursing", "diagnosis", "treatment protocols", "emr",
    ],
    "data_science": [
        "python", "tensorflow", "pytorch", "pandas", "numpy", "scikit-learn",
        "machine learning", "deep learning", "nlp", "statistics", "a/b testing",
        "feature engineering", "model deployment", "big data", "spark", "sql",
        "data visualization", "jupyter", "r", "mlops",
    ],
    "devops": [
        "docker", "kubernetes", "terraform", "aws", "gcp", "azure", "ci/cd",
        "jenkins", "github actions", "ansible", "prometheus", "grafana", "linux",
        "shell scripting", "nginx", "helm", "argocd", "infrastructure as code",
    ],
    "business": [
        "strategy", "revenue", "kpis", "stakeholder management", "leadership",
        "agile", "project management", "business analysis", "roi", "budget",
        "market research", "cross-functional", "p&l", "crm", "growth", "operations",
    ],
    "creative": [
        "figma", "adobe", "photoshop", "illustrator", "ux", "ui", "prototyping",
        "wireframes", "user research", "brand identity", "typography", "motion graphics",
        "responsive design", "design systems", "accessibility",
    ],
    "legal": [
        "contract drafting", "litigation", "compliance", "regulatory", "due diligence",
        "ip", "corporate law", "legal research", "negotiation", "arbitration",
        "bar admission", "case management", "legal tech",
    ],
}


def _infer_industry(target_role: str) -> str:
    """Infer the industry from the target role string."""
    role_lower = target_role.lower()

    mappings = {
        "technology": ["software", "engineer", "developer", "frontend", "backend",
                       "full stack", "fullstack", "devops", "sre", "mobile", "qa",
                       "web", "cloud", "platform"],
        "finance": ["finance", "banking", "accounting", "analyst", "trader",
                    "investment", "actuary", "auditor"],
        "healthcare": ["nurse", "doctor", "clinical", "healthcare", "medical",
                       "pharmacy", "therapist", "surgeon"],
        "data_science": ["data", "machine learning", "ml", "ai ", "scientist",
                         "analytics"],
        "devops": ["devops", "sre", "infrastructure", "platform engineer",
                   "site reliability"],
        "business": ["business", "manager", "product", "operations", "consultant",
                     "strategy", "marketing"],
        "creative": ["designer", "ux", "ui", "creative", "graphic", "brand"],
        "legal": ["legal", "lawyer", "attorney", "paralegal", "counsel"],
    }

    for industry, keywords in mappings.items():
        for kw in keywords:
            if kw in role_lower:
                return industry
    return "technology"  # default


def _get_keywords_for_industry(industry: str) -> List[str]:
    """Return keyword bank for a given industry."""
    return INDUSTRY_KEYWORDS.get(industry, INDUSTRY_KEYWORDS["technology"])


# ---------------------------------------------------------------------------
# OCR Noise Cleaning
# ---------------------------------------------------------------------------
def _clean_ocr_text(text: str) -> str:
    """Silently reconstruct OCR-noisy text before evaluation."""
    # Fix common OCR artifacts
    text = re.sub(r'[|]', 'l', text)  # pipe -> l
    text = re.sub(r'(?<=[a-z])0(?=[a-z])', 'o', text)  # zero in word -> o
    text = re.sub(r'\s{3,}', '  ', text)  # collapse excessive whitespace
    text = re.sub(r'[^\x00-\x7F]+', ' ', text)  # remove non-ASCII junk
    text = re.sub(r'\n{3,}', '\n\n', text)  # collapse blank lines
    return text.strip()


# ---------------------------------------------------------------------------
# Heuristic Analysis Engine (fallback when Gemini unavailable)
# ---------------------------------------------------------------------------
def _heuristic_analysis(text: str, target_role: str, industry: str) -> dict:
    """
    Intelligent heuristic analysis producing the enterprise-grade JSON schema.
    Used as fallback when Gemini AI is unavailable.
    """
    text_lower = text.lower()
    keywords = _get_keywords_for_industry(industry)

    # --- Keyword Analysis ---
    matched = []
    missing = []
    for kw in keywords:
        pattern = r'\b' + re.escape(kw) + r'\b'
        if re.search(pattern, text_lower) or kw in text_lower:
            matched.append(kw.title())
        else:
            missing.append(kw.title())

    # Baseline: if resume has decent content but few keyword matches
    if len(matched) < 3 and len(text) > 100:
        for kw in keywords[:5]:
            titled = kw.title()
            if titled not in matched:
                matched.append(titled)

    keyword_ratio = len(matched) / max(len(keywords), 1)
    keyword_score = min(96, max(40, int(35 + keyword_ratio * 65)))

    # --- Impact & Quantification ---
    action_verbs = [
        'architected', 'engineered', 'optimized', 'implemented', 'developed',
        'designed', 'built', 'deployed', 'reduced', 'increased', 'improved',
        'led', 'managed', 'delivered', 'automated', 'scaled', 'streamlined',
        'launched', 'drove', 'transformed', 'spearheaded', 'accelerated',
    ]
    found_verbs = [v for v in action_verbs if v in text_lower]
    has_metrics = bool(re.search(r'\d+%|\d+x|\$[\d,]+|reduced|increased|improved\s+by', text, re.I))
    has_quantified = bool(re.search(r'\d+\s*(users|customers|requests|transactions|ms|seconds|revenue|clients)', text, re.I))

    impact_score = 45
    impact_score += min(25, len(found_verbs) * 5)
    if has_metrics:
        impact_score += 12
    if has_quantified:
        impact_score += 10
    impact_score = min(96, impact_score)

    # --- Experience Relevance ---
    standard_sections = ['experience', 'education', 'skills', 'projects',
                         'work experience', 'technical skills', 'summary',
                         'objective', 'certifications', 'achievements']
    found_sections = [s for s in standard_sections if s in text_lower]
    has_contact = bool(re.search(r'[\w.-]+@[\w.-]+', text)) or bool(re.search(r'\d{3}[-.\\s]?\d{3}[-.\\s]?\d{4}', text))
    has_education = 'education' in text_lower or 'degree' in text_lower or 'university' in text_lower
    has_experience_years = bool(re.search(r'\d+\+?\s*(years?|yrs?)\s*(of\s+)?experience', text_lower))

    experience_score = 50
    experience_score += min(20, len(found_sections) * 4)
    if has_contact:
        experience_score += 5
    if has_education:
        experience_score += 8
    if has_experience_years:
        experience_score += 10
    experience_score = min(95, experience_score)

    # --- Clarity & Structure ---
    has_bullets = bool(re.search(r'[•\-\*]', text))
    is_single_page = len(text) < 4000
    has_clear_headers = len(found_sections) >= 3

    clarity_score = 55
    if has_bullets:
        clarity_score += 10
    if is_single_page:
        clarity_score += 8
    if has_clear_headers:
        clarity_score += 12
    if has_contact:
        clarity_score += 5
    clarity_score = min(95, clarity_score)

    # --- Overall (weighted: 40% Keywords, 25% Impact, 20% Relevance, 15% Clarity) ---
    overall = round(
        keyword_score * 0.40 +
        impact_score * 0.25 +
        experience_score * 0.20 +
        clarity_score * 0.15
    )

    # --- Accurate Candidate Seniority Detection ---
    is_undergrad = bool(re.search(r'\b(undergraduate|student|intern|internship|trainee|undergrad|bachelor|bsc|candidate)\b', text_lower))
    has_lead_experience = bool(re.search(r'\b(tech lead|team lead|lead developer|engineering manager|principal engineer|solutions architect)\b', text_lower))
    has_senior_experience = bool(re.search(r'\b(senior software engineer|senior developer|senior engineer|sr\.)\b', text_lower))

    detected_years = 0
    if has_experience_years:
        years_match = re.search(r'(\d+)\+?\s*(years?|yrs?)', text_lower)
        if years_match:
            detected_years = int(years_match.group(1))

    # If undergraduate or intern is explicitly present, clamp base years
    if is_undergrad and detected_years > 2:
        detected_years = 1  # Student degree year or academic duration

    if has_lead_experience and detected_years >= 6 and not is_undergrad:
        candidate_level = 4
        seniority = "Tech Lead / Principal (6+ yrs)"
    elif (has_senior_experience or detected_years >= 5) and not is_undergrad:
        candidate_level = 3
        seniority = "Senior Level (4-6 yrs)"
    elif detected_years >= 2 and not is_undergrad:
        candidate_level = 2
        seniority = "Mid-Level (2-3 yrs)"
    elif detected_years >= 1 and not is_undergrad:
        candidate_level = 1
        seniority = "Junior / Associate (1-2 yrs)"
    else:
        candidate_level = 0
        seniority = "Entry-Level / Intern / Student (0-1 yr)"

    detected_domain = f"{industry.replace('_', ' ').title()} — {seniority}"

    # --- Target Role Seniority Classification ---
    target_lower = target_role.lower()
    if any(k in target_lower for k in ['lead', 'principal', 'architect', 'staff', 'manager', 'director', 'head']):
        target_level = 4
        role_category = "Tech Lead / Principal"
    elif any(k in target_lower for k in ['senior', 'sr.', 'specialist']):
        target_level = 3
        role_category = "Senior Software Engineer"
    elif any(k in target_lower for k in ['mid', 'experienced', 'level 2', 'ii']):
        target_level = 2
        role_category = "Mid-Level Engineer"
    elif any(k in target_lower for k in ['junior', 'associate', 'jr.', 'level 1', 'graduate']):
        target_level = 1
        role_category = "Junior Developer"
    elif any(k in target_lower for k in ['intern', 'internship', 'trainee', 'student']):
        target_level = 0
        role_category = "Software Engineer Intern"
    else:
        target_level = 2  # General "Software Engineer" / "Fullstack Developer"
        role_category = "Software Engineer"

    # --- Seniority Gap Calculation & Score Penalties ---
    seniority_gap = target_level - candidate_level
    red_flags = []

    if seniority_gap >= 3:
        # Severe Mismatch (e.g. Intern applying for Tech Lead / Principal)
        experience_score = min(experience_score, 24)
        overall = min(overall, 38)
        summary = (
            f"⚠️ Critical Seniority Mismatch: Target role is {target_role} ({role_category}), but candidate profile "
            f"demonstrates {seniority}. A {target_role} position strictly mandates 6-8+ years of production experience, "
            f"high-scale system architecture, and engineering team leadership. An undergraduate or entry-level resume "
            f"will be immediately filtered out by enterprise ATS systems for this seniority. We strongly recommend targeting "
            f"'Software Engineer Intern' or 'Junior Associate' positions where this resume will be highly competitive."
        )
        red_flags.append(f"CRITICAL SENIORITY DEFICIT: {target_role} requires 6-8+ years and team management; candidate profile is {seniority}.")
        red_flags.append(f"LACK OF ARCHITECTURAL OWNERSHIP: Zero evidence of leading architectural roadmaps, sprint planning, hiring, or mentoring expected of a {target_role}.")
    elif seniority_gap == 2:
        # Significant Mismatch (e.g. Intern applying for Senior, or Junior applying for Lead)
        experience_score = min(experience_score, 36)
        overall = min(overall, 48)
        summary = (
            f"⚠️ Seniority Gap Identified: Applying for {target_role} ({role_category}) with {seniority}. "
            f"While foundational technical skills are present, enterprise ATS filters for {target_role} look for 4-6+ years "
            f"of independent production delivery, system design depth, and ownership beyond early career tenure."
        )
        red_flags.append(f"SENIORITY GAP: {target_role} typically requires 4-6+ years production tenure; candidate shows {seniority}.")
    elif seniority_gap == 1:
        # Slight stretch (e.g. Intern applying for Mid-Level)
        overall = min(overall, 65)
        summary = (
            f"Stretch Candidate for {target_role}: Candidate has {seniority}. Meets entry requirements but will face "
            f"tough competition against candidates with 2-3+ years of dedicated commercial experience."
        )
        red_flags.append(f"Experience Stretch: Target role ({target_role}) expects more commercial production history than currently shown.")
    else:
        # Good Alignment (Intern -> Intern, Junior -> Junior, etc.)
        if overall >= 85:
            summary = (
                f"Strong candidate profile for {target_role} with excellent keyword alignment and "
                f"quantified impact statements. Experience level ({seniority}) well matches role expectations."
            )
        elif overall >= 70:
            summary = (
                f"Solid foundation for {target_role} applications. Experience level ({seniority}) is appropriate. "
                f"Resume covers core competencies but needs refinement in impact quantification and keyword optimization."
            )
        else:
            summary = (
                f"Resume requires enhancement for {target_role} applications. Key gaps in industry keywords "
                f"and structural clarity should be addressed to pass enterprise ATS filters."
            )

    # --- Standard Red Flags ---
    if not has_metrics:
        red_flags.append("No quantified achievements found — ATS systems deprioritize resumes without measurable impact.")
    if len(found_verbs) < 3:
        red_flags.append("Weak action verb usage — bullet points read as passive duty descriptions rather than owned accomplishments.")
    if len(found_sections) < 3:
        red_flags.append("Missing standard resume sections — ATS parsers expect Skills, Experience, Education, and Projects headings.")
    if not has_contact:
        red_flags.append("Contact information not clearly detected — ensure email and phone are in the header.")
    if len(matched) < 5:
        red_flags.append(f"Critical keyword gap — fewer than 5 of the expected {len(keywords)} industry keywords were matched.")

    # --- Bullet Point Optimizations ---
    bullet_optimizations = []
    lines = text.split('\n')
    weak_bullets = []
    for line in lines:
        stripped = line.strip()
        if stripped.startswith(('-', '•', '*')) and len(stripped) > 15:
            content = stripped.lstrip('-•* ').strip()
            # Check for passive/weak patterns
            if not any(v in content.lower() for v in action_verbs[:10]):
                weak_bullets.append(content)
            elif not re.search(r'\d', content):
                weak_bullets.append(content)

    for bullet in weak_bullets[:3]:
        issue = "Lacks quantifiable metrics" if not re.search(r'\d', bullet) else "Uses passive voice without ownership"
        if not any(v in bullet.lower() for v in action_verbs[:10]):
            issue = "Missing strong action verb — reads as a duty listing"
        bullet_optimizations.append({
            "original_text": bullet,
            "issue": issue,
            "enterprise_rewrite": f"Engineered/Optimized [specific system] resulting in [X]% improvement in [metric], by implementing [specific approach/technology]"
        })

    if not bullet_optimizations:
        bullet_optimizations.append({
            "original_text": "Worked on backend systems",
            "issue": "Vague, no metrics, passive voice — fails ATS relevance scoring",
            "enterprise_rewrite": f"Architected scalable backend microservices handling [X]K+ RPM, reducing API latency by [Y]% through Redis caching and query optimization"
        })

    # --- Certifications / Tools Recommendations ---
    cert_recommendations = {
        "technology": ["AWS Certified Solutions Architect", "Google Cloud Professional", "Kubernetes (CKA/CKAD)"],
        "finance": ["CFA Level I/II/III", "FRM (Financial Risk Manager)", "Bloomberg Terminal Certification"],
        "healthcare": ["Board Certification", "HIPAA Compliance Training", "Clinical Research (GCP)"],
        "data_science": ["TensorFlow Developer Certificate", "AWS ML Specialty", "Google Data Analytics Professional"],
        "devops": ["AWS DevOps Professional", "CKA (Certified Kubernetes Administrator)", "HashiCorp Terraform Associate"],
        "business": ["PMP (Project Management Professional)", "Six Sigma Green Belt", "Certified Scrum Master"],
        "creative": ["Google UX Design Certificate", "Adobe Certified Expert", "Interaction Design Foundation"],
        "legal": ["Bar Admission", "Certified Compliance & Ethics Professional", "Legal Project Management"],
    }
    recommended_certs = cert_recommendations.get(industry, cert_recommendations["technology"])

    # --- Action Plan ---
    action_plan = []
    if seniority_gap >= 2:
        action_plan.append(f"Re-align Target Role to 'Software Engineer Intern' or 'Junior Developer': Your current background ({seniority}) is primed for student/internship applications where it will achieve a 75-88%+ score, whereas applying for {target_role} results in immediate ATS rejection.")
    if len(missing) > 0:
        action_plan.append(f"Add these critical {target_role} keywords to your Skills and Experience sections: {', '.join(missing[:5])}.")
    if not has_metrics:
        action_plan.append("Quantify every bullet point using the XYZ formula: 'Accomplished [X] as measured by [Y], by doing [Z]'.")
    if len(found_verbs) < 5:
        action_plan.append("Replace passive language with power verbs: Architected, Spearheaded, Engineered, Automated, Scaled.")
    if len(found_sections) < 4:
        action_plan.append("Add standard ATS-parseable sections: Technical Skills, Work Experience, Projects, Education, Certifications.")
    action_plan.append(f"Obtain at least one of: {', '.join(recommended_certs[:2])} to strengthen credibility.")
    action_plan.append(f"Tailor your resume for each {target_role} application using the target job description's exact phrasing.")
    if not is_single_page and seniority in ("Entry-Level / Intern", "Junior / Early Career"):
        action_plan.append("Condense to a single page — recruiters spend 6-8 seconds on initial scan.")

    return {
        "ats_compatibility_score": overall,
        "section_scores": {
            "keyword_alignment": keyword_score,
            "impact_and_metrics": impact_score,
            "experience_relevance": experience_score,
            "clarity_and_structure": clarity_score,
        },
        "detected_domain": detected_domain,
        "executive_summary": summary,
        "keyword_analysis": {
            "matched_keywords": matched,
            "missing_critical_keywords": missing[:8],
            "recommended_certifications_or_tools": recommended_certs,
        },
        "critical_red_flags": red_flags,
        "bullet_point_optimizations": bullet_optimizations,
        "tailored_action_plan": action_plan,
        # Legacy compatibility fields for existing frontend/backend
        "overallScore": overall,
        "atsScore": keyword_score,
        "formattingScore": clarity_score,
        "impactScore": impact_score,
        "detectedKeywords": matched,
        "missingKeywords": missing[:6],
        "suggestions": action_plan[:5],
        "strengths": [
            s for s in [
                f"Strong {target_role}-relevant keyword presence" if len(matched) >= 5 else None,
                "Well-structured resume with standard section headings" if has_clear_headers else None,
                "Good use of action verbs demonstrating ownership" if len(found_verbs) >= 3 else None,
                "Includes quantified results showing measurable impact" if has_metrics else None,
                f"Concise format ideal for {target_role} roles" if is_single_page else None,
            ] if s
        ] or ["Resume submitted — good first step toward optimization"],
    }


# ---------------------------------------------------------------------------
# Main ATS Service
# ---------------------------------------------------------------------------
class ATSService:
    """
    Enterprise-Grade ATS Parsing Engine with Gemini AI + RAG augmentation.
    Falls back to intelligent heuristic analysis when LLM is unavailable.
    """

    @classmethod
    def analyze_resume_text(
        cls,
        text: str,
        target_role: str = "Software Engineer",
        industry: Optional[str] = None,
        job_description: Optional[str] = None,
    ) -> dict:
        """
        Analyze resume text with enterprise-grade ATS evaluation.

        Args:
            text: Raw resume text (potentially OCR-extracted with noise)
            target_role: Target job role for the evaluation
            industry: Optional industry override (auto-detected if omitted)
            job_description: Optional target job description for tailored matching

        Returns:
            Enterprise-grade ATS diagnostic JSON object
        """
        if not text or not text.strip():
            return {"error": "Resume text cannot be empty", "ats_compatibility_score": 0}

        # Step 0: Clean OCR noise
        cleaned_text = _clean_ocr_text(text)

        # Resolve industry
        resolved_industry = industry or _infer_industry(target_role)

        # Step 1: Retrieve RAG industry benchmarks
        rag_context = ""
        try:
            rag_query = f"ATS resume evaluation benchmarks for {target_role} in {resolved_industry}"
            rag_context = RAGService.augment_prompt(rag_query, context="RESUME", top_k=3)
        except Exception as e:
            print(f"[ATSService] RAG retrieval skipped: {e}")

        # Step 2: Try Gemini AI-powered analysis
        result = cls._analyze_with_gemini(
            cleaned_text, target_role, resolved_industry, job_description, rag_context
        )

        if result:
            return result

        # Step 3: Fallback to heuristic analysis
        print("[ATSService] Using heuristic fallback analysis")
        return _heuristic_analysis(cleaned_text, target_role, resolved_industry)

    @classmethod
    def _analyze_with_gemini(
        cls,
        text: str,
        target_role: str,
        industry: str,
        job_description: Optional[str],
        rag_context: str,
    ) -> Optional[dict]:
        """Perform enterprise-grade ATS analysis using Gemini LLM + RAG context."""
        if not genai or not GEMINI_API_KEY:
            return None

        # Try active models with appropriate timeouts for full document parsing
        candidate_models = [
            "gemini-3.5-flash",
            "gemini-3.5-flash-lite",
            "gemini-flash-latest",
            "gemini-3.8-flash",
        ]

        # Build the enterprise ATS prompt
        jd_block = ""
        if job_description:
            jd_block = f"""
[TARGET_JOB_DESCRIPTION]
\"\"\"
{job_description[:3000]}
\"\"\"
"""

        rag_block = ""
        if rag_context:
            rag_block = f"""
[RAG_INDUSTRY_BENCHMARKS]
\"\"\"
{rag_context[:2000]}
\"\"\"
"""

        prompt = f"""You are an Enterprise-Grade Applicant Tracking System (ATS) Parsing Engine and Executive Career Strategist with deep recruitment expertise across ALL global industries.

[TARGET_ROLE]: {target_role}
[INDUSTRY]: {industry.replace('_', ' ').title()}
{jd_block}
{rag_block}

[RESUME_TEXT]
\"\"\"
{text[:5000]}
\"\"\"

# INPUT PROCESSING RULES (OCR & RAG HANDLING)
1. **OCR Noise Tolerance:** The resume text is extracted via Tesseract OCR and may contain broken words, misaligned columns, weird symbols, or merged lines. Do NOT penalize the candidate for OCR extraction artifacts. Silently reconstruct the intended words and structure before evaluating.
2. **Domain Adaptability:** Dynamically shift your evaluation rubric based on the TARGET_ROLE and INDUSTRY.
3. **RAG Context Utilization:** Cross-reference the resume against the RAG_INDUSTRY_BENCHMARKS provided to check for current market-standard competencies, certifications, and keywords.

# SCORING RUBRIC (Weighted Section Breakdown - Total 100%)
- **Keyword Alignment & ATS Parsability (40%):** Exact & semantic match of core skills, domain tools, methodologies, and certifications.
- **Quantifiable Impact & Metrics (25%):** Adoption of Google's XYZ formula ("Accomplished [X] as measured by [Y], by doing [Z]") with clear numerical metrics.
- **Role & Experience Relevance (20%):** Alignment of past responsibilities with seniority level and industry expectations.
- **Formatting, Structure & Readability (15%):** Clear structural hierarchy, logical sectioning, professional bullet syntax.

# OUTPUT FORMAT (STRICT JSON)
Respond ONLY with a valid, raw JSON object adhering to this exact schema (no markdown code blocks):
{{
  "ats_compatibility_score": <integer 0-100>,
  "section_scores": {{
    "keyword_alignment": <integer 0-100>,
    "impact_and_metrics": <integer 0-100>,
    "experience_relevance": <integer 0-100>,
    "clarity_and_structure": <integer 0-100>
  }},
  "detected_domain": "<string: inferred industry and seniority level>",
  "executive_summary": "<string: 2-3 sentence high-level verdict on candidate readiness>",
  "keyword_analysis": {{
    "matched_keywords": ["<string>"],
    "missing_critical_keywords": ["<string>"],
    "recommended_certifications_or_tools": ["<string>"]
  }},
  "critical_red_flags": ["<string: specific weaknesses, vague areas, or role mismatches>"],
  "bullet_point_optimizations": [
    {{
      "original_text": "<string: weak bullet point from the CV>",
      "issue": "<string: why it fails (e.g., lacks metrics, passive voice)>",
      "enterprise_rewrite": "<string: rewritten high-impact version using strong action verbs and quantifiable placeholders like [X]%>"
    }}
  ],
  "tailored_action_plan": ["<string: step-by-step improvements to reach a 90+ score for this specific role>"]
}}"""

        for model_name in candidate_models:
            try:
                model = genai.GenerativeModel(model_name)
                try:
                    response = model.generate_content(prompt, request_options={"timeout": 35.0})
                except TypeError:
                    response = model.generate_content(prompt)
                if not response or not response.text:
                    continue

                # Parse JSON from response
                raw = response.text.strip()
                raw = raw.replace("```json", "").replace("```", "").strip()
                parsed = json.loads(raw)

                # Validate and clamp scores
                section_scores = parsed.get("section_scores", {})
                overall = max(0, min(100, parsed.get("ats_compatibility_score", 0)))

                result = {
                    "ats_compatibility_score": overall,
                    "section_scores": {
                        "keyword_alignment": max(0, min(100, section_scores.get("keyword_alignment", 0))),
                        "impact_and_metrics": max(0, min(100, section_scores.get("impact_and_metrics", 0))),
                        "experience_relevance": max(0, min(100, section_scores.get("experience_relevance", 0))),
                        "clarity_and_structure": max(0, min(100, section_scores.get("clarity_and_structure", 0))),
                    },
                    "detected_domain": parsed.get("detected_domain", f"{industry.title()} — Unknown"),
                    "executive_summary": parsed.get("executive_summary", ""),
                    "keyword_analysis": {
                        "matched_keywords": parsed.get("keyword_analysis", {}).get("matched_keywords", []),
                        "missing_critical_keywords": parsed.get("keyword_analysis", {}).get("missing_critical_keywords", []),
                        "recommended_certifications_or_tools": parsed.get("keyword_analysis", {}).get("recommended_certifications_or_tools", []),
                    },
                    "critical_red_flags": parsed.get("critical_red_flags", []),
                    "bullet_point_optimizations": parsed.get("bullet_point_optimizations", []),
                    "tailored_action_plan": parsed.get("tailored_action_plan", []),
                }

                # Add legacy compatibility fields
                result["overallScore"] = overall
                result["atsScore"] = result["section_scores"]["keyword_alignment"]
                result["formattingScore"] = result["section_scores"]["clarity_and_structure"]
                result["impactScore"] = result["section_scores"]["impact_and_metrics"]
                result["detectedKeywords"] = result["keyword_analysis"]["matched_keywords"]
                result["missingKeywords"] = result["keyword_analysis"]["missing_critical_keywords"][:6]
                result["suggestions"] = result["tailored_action_plan"][:5]
                result["strengths"] = []

                # Derive strengths from scores
                if result["section_scores"]["keyword_alignment"] >= 75:
                    result["strengths"].append("Strong keyword alignment with target role requirements")
                if result["section_scores"]["impact_and_metrics"] >= 75:
                    result["strengths"].append("Excellent use of quantified impact statements")
                if result["section_scores"]["experience_relevance"] >= 75:
                    result["strengths"].append("Relevant experience depth matches seniority expectations")
                if result["section_scores"]["clarity_and_structure"] >= 75:
                    result["strengths"].append("Clean, ATS-parseable resume structure")
                if not result["strengths"]:
                    result["strengths"].append("Resume submitted — demonstrates initiative for career growth")

                return result

            except json.JSONDecodeError as e:
                print(f"[ATSService] Model {model_name} JSON parse error: {e}")
                continue
            except Exception as e:
                print(f"[ATSService] Model {model_name} failed: {e}")
                if "429" in str(e) or "Quota exceeded" in str(e):
                    print("[ATSService] Gemini API quota reached. Switching immediately to RAG / Heuristic engine.")
                    break
                continue

        return None
