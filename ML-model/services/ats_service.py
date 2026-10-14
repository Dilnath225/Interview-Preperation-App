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

    # --- Overall (weighted) ---
    overall = round(
        keyword_score * 0.30 +
        impact_score * 0.30 +
        experience_score * 0.25 +
        clarity_score * 0.15
    )

    # --- Detect seniority ---
    if has_experience_years:
        years_match = re.search(r'(\d+)\+?\s*(years?|yrs?)', text_lower)
        years = int(years_match.group(1)) if years_match else 0
        if years >= 8:
            seniority = "Senior / Staff Level"
        elif years >= 4:
            seniority = "Mid-Level"
        elif years >= 1:
            seniority = "Junior / Early Career"
        else:
            seniority = "Entry-Level / Intern"
    else:
        seniority = "Entry-Level / Intern"

    detected_domain = f"{industry.replace('_', ' ').title()} — {seniority}"

    # --- Executive Summary ---
    if overall >= 85:
        summary = (
            f"Strong candidate profile for {target_role} with excellent keyword alignment and "
            f"quantified impact statements. Resume demonstrates production-ready competencies "
            f"and is well-positioned for ATS screening at top-tier organizations."
        )
    elif overall >= 70:
        summary = (
            f"Solid foundation for {target_role} applications. Resume covers core competencies "
            f"but needs refinement in impact quantification and keyword optimization to "
            f"consistently pass enterprise ATS filters."
        )
    else:
        summary = (
            f"Resume requires significant enhancement for {target_role} positions. Key gaps "
            f"in industry-standard keywords, quantified achievements, and structural clarity "
            f"will likely cause ATS rejection at competitive organizations."
        )

    # --- Red Flags ---
    red_flags = []
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

        try:
            model = genai.GenerativeModel("gemini-3.5-flash")

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

# EVALUATION DIMENSIONS
- **Keyword & Semantic Alignment (30%):** Hard skills, domain tools, methodologies, and industry terminology matching the target role.
- **Impact & Quantification (30%):** Use of action verbs, measurable outcomes (metrics, percentages, revenue, time saved, scale), and the XYZ/STAR impact formula rather than passive duty listing.
- **Role & Seniority Fit (25%):** Career progression, relevant experience depth, education, and certifications matching the seniority level.
- **Structural & Clarity Index (15%):** Logical sectioning, brevity, absence of buzzword fluff, and professional presentation.

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

            response = model.generate_content(prompt)
            if not response or not response.text:
                return None

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
            print(f"[ATSService] Gemini response JSON parse error: {e}")
            return None
        except Exception as e:
            print(f"[ATSService] Gemini analysis error: {e}")
            return None
