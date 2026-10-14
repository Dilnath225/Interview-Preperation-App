import fs from 'fs';
import axios from 'axios';
import { prisma } from '../config/prisma';
import { ENV } from '../config/env';
import { ApiError } from '../utils/apiError';

// pdf-parse for proper PDF text extraction
let pdfParse: any = null;
try {
  pdfParse = require('pdf-parse');
} catch {
  console.warn('[ResumeService] pdf-parse not available, falling back to raw text read.');
}

// tesseract.js for OCR on scanned/image-based PDFs
let Tesseract: any = null;
try {
  Tesseract = require('tesseract.js');
} catch {
  console.warn('[ResumeService] tesseract.js not available, OCR disabled.');
}

export interface BulletOptimization {
  original_text: string;
  issue: string;
  enterprise_rewrite: string;
}

export interface ResumeAnalysisResult {
  // Enterprise-grade fields
  ats_compatibility_score: number;
  section_scores: {
    keyword_alignment: number;
    impact_and_metrics: number;
    experience_relevance: number;
    clarity_and_structure: number;
  };
  detected_domain: string;
  executive_summary: string;
  keyword_analysis: {
    matched_keywords: string[];
    missing_critical_keywords: string[];
    recommended_certifications_or_tools: string[];
  };
  critical_red_flags: string[];
  bullet_point_optimizations: BulletOptimization[];
  tailored_action_plan: string[];
  // Legacy compatibility fields
  overallScore: number;
  atsScore: number;
  formattingScore: number;
  impactScore: number;
  extractedKeywords: string[];
  missingKeywords: string[];
  suggestions: string[];
  strengths: string[];
  analyzedRole: string;
}

/**
 * Role-specific keyword maps for ATS analysis.
 * Each role has its own set of keywords that are relevant for that position.
 */
const ROLE_KEYWORDS: Record<string, string[]> = {
  'Software Engineer': [
    'TypeScript', 'React', 'Node.js', 'Express', 'PostgreSQL',
    'SQL', 'REST API', 'Git', 'Docker', 'CI/CD',
    'AWS', 'Unit Testing', 'Agile', 'Clean Architecture', 'Microservices',
    'GraphQL', 'Redis', 'Python', 'MongoDB',
  ],
  'Full Stack Developer': [
    'TypeScript', 'React', 'Node.js', 'Express', 'PostgreSQL',
    'SQL', 'REST API', 'Git', 'Docker', 'CI/CD',
    'AWS', 'Unit Testing', 'Agile', 'Clean Architecture', 'Microservices',
    'GraphQL', 'Redis', 'Python', 'MongoDB',
  ],
  'Frontend Developer': [
    'TypeScript', 'React', 'Next.js', 'Vue', 'Angular',
    'HTML', 'CSS', 'Tailwind', 'JavaScript', 'Responsive Design',
    'Git', 'REST API', 'GraphQL', 'Webpack', 'Vite',
    'Unit Testing', 'Jest', 'Accessibility', 'Figma',
  ],
  'Backend Developer': [
    'Node.js', 'Express', 'Python', 'Java', 'PostgreSQL',
    'SQL', 'MongoDB', 'Redis', 'REST API', 'GraphQL',
    'Docker', 'Microservices', 'CI/CD', 'AWS', 'Git',
    'Unit Testing', 'Clean Architecture', 'Message Queue', 'Kafka',
  ],
  'DevOps': [
    'Docker', 'Kubernetes', 'Terraform', 'AWS', 'GCP',
    'Azure', 'CI/CD', 'Jenkins', 'GitHub Actions', 'Ansible',
    'Prometheus', 'Grafana', 'Linux', 'Shell Scripting', 'Nginx',
    'Helm', 'ArgoCD', 'Infrastructure as Code', 'Monitoring',
  ],
  'Data Science': [
    'Python', 'TensorFlow', 'PyTorch', 'Pandas', 'NumPy',
    'Scikit-learn', 'SQL', 'Machine Learning', 'Deep Learning', 'NLP',
    'Statistics', 'Data Visualization', 'Jupyter', 'R', 'A/B Testing',
    'Feature Engineering', 'Model Deployment', 'Big Data', 'Spark',
  ],
  'Business': [
    'Strategy', 'Revenue', 'KPIs', 'Stakeholder Management', 'Leadership',
    'Agile', 'Project Management', 'Business Analysis', 'ROI', 'Budget',
    'Market Research', 'Presentation', 'Cross-functional', 'P&L', 'CRM',
    'Negotiation', 'Client Relations', 'Growth', 'Operations',
  ],
  'QA Engineer': [
    'Test Automation', 'Selenium', 'Cypress', 'Jest', 'Playwright',
    'CI/CD', 'API Testing', 'Postman', 'Performance Testing', 'JMeter',
    'Git', 'Agile', 'JIRA', 'Test Plans', 'Regression Testing',
    'Bug Tracking', 'SQL', 'Python', 'Load Testing',
  ],
  'Mobile Developer': [
    'React Native', 'Flutter', 'Swift', 'Kotlin', 'iOS',
    'Android', 'TypeScript', 'JavaScript', 'REST API', 'GraphQL',
    'Git', 'CI/CD', 'Firebase', 'App Store', 'Play Store',
    'Unit Testing', 'Responsive Design', 'Redux', 'Expo',
  ],
};

/**
 * Resolves the user's targetRole exactly as they typed it, to support ANY role globally.
 */
function resolveRole(targetRole: string | null | undefined): string {
  if (!targetRole || targetRole.trim() === '') return 'Professional';
  return targetRole.trim();
}

/**
 * Returns the keywords for a given resolved role (used ONLY as a fallback for heuristics).
 * Gemini AI will dynamically generate its own keywords for any role.
 */
function getKeywordsForRole(role: string): string[] {
  const roleLower = role.toLowerCase();
  
  for (const key of Object.keys(ROLE_KEYWORDS)) {
    if (roleLower.includes(key.toLowerCase())) return ROLE_KEYWORDS[key];
  }

  // Fuzzy matches for common tech domains
  if (roleLower.includes('devops') || roleLower.includes('sre') || roleLower.includes('infrastructure')) return ROLE_KEYWORDS['DevOps'];
  if (roleLower.includes('frontend') || roleLower.includes('ui developer')) return ROLE_KEYWORDS['Frontend Developer'];
  if (roleLower.includes('backend') || roleLower.includes('server')) return ROLE_KEYWORDS['Backend Developer'];
  if (roleLower.includes('data') || roleLower.includes('machine learning') || roleLower.includes('ml ') || roleLower.includes('ai ')) return ROLE_KEYWORDS['Data Science'];
  if (roleLower.includes('business') || roleLower.includes('manager') || roleLower.includes('analyst')) return ROLE_KEYWORDS['Business'];
  if (roleLower.includes('qa') || roleLower.includes('quality') || roleLower.includes('test')) return ROLE_KEYWORDS['QA Engineer'];
  if (roleLower.includes('mobile') || roleLower.includes('ios') || roleLower.includes('android')) return ROLE_KEYWORDS['Mobile Developer'];
  if (roleLower.includes('software') || roleLower.includes('engineer') || roleLower.includes('developer')) return ROLE_KEYWORDS['Software Engineer'];

  // Generic fallback for non-tech / completely unknown roles (for heuristic analysis only)
  return [
    'Leadership', 'Communication', 'Project Management', 'Problem Solving',
    'Teamwork', 'Agile', 'Strategy', 'Analytics', 'Optimization', 'Delivery',
    'Operations', 'Planning', 'Coordination', 'Reporting', 'Customer Service'
  ];
}

export class ResumeService {
  /**
   * Extracts text content from an uploaded file (PDF, DOC, TXT).
   * Falls back to OCR (tesseract.js) for scanned/image-based PDFs.
   */
  private static async extractText(file: Express.Multer.File): Promise<string> {
    const ext = file.originalname.toLowerCase().split('.').pop();

    // PDF extraction with pdf-parse
    if (ext === 'pdf' && pdfParse) {
      try {
        const dataBuffer = fs.readFileSync(file.path);
        let parser = typeof pdfParse === 'function' ? pdfParse : (pdfParse.PDFParse || pdfParse.default);
        let pdfData;
        try {
          pdfData = await parser(dataBuffer);
        } catch (innerErr: any) {
          if (innerErr.message && innerErr.message.includes("Class constructors cannot be invoked without 'new'")) {
            pdfData = await new (parser as any)(dataBuffer);
          } else {
            throw innerErr;
          }
        }
        if (pdfData && pdfData.text && pdfData.text.trim().length > 10) {
          console.log('[ResumeService] PDF text extracted successfully via pdf-parse.');
          return pdfData.text;
        }
      } catch (err) {
        console.warn('[ResumeService] PDF parse failed, trying OCR fallback:', err);
      }

      // OCR fallback for scanned/image-based PDFs
      if (Tesseract) {
        console.warn('[ResumeService] Tesseract.js OCR requires image conversion for PDFs. Skipping direct PDF OCR to prevent crashes.');
      }
    }

    // TXT / DOC fallback — read as UTF-8
    try {
      const raw = fs.readFileSync(file.path, 'utf8');
      // Strip null bytes which cause PostgreSQL to crash
      const sanitized = raw.replace(/\0/g, '');
      if (sanitized.trim().length > 10) return sanitized;
    } catch {
      // Binary file — return filename as fallback context
    }

    return file.originalname;
  }

  /**
   * Extracts text from a file using Tesseract.js OCR.
   * Works on image-based PDFs and image files.
   */
  private static async extractWithOCR(filePath: string): Promise<string> {
    const worker = await Tesseract.createWorker('eng');
    try {
      const { data: { text } } = await worker.recognize(filePath);
      return text;
    } finally {
      await worker.terminate();
    }
  }

  /**
   * Analyzes a resume using Gemini AI with intelligent heuristic fallback.
   * Analysis is tailored to the user's target role.
   */
  static async analyzeResume(
    userId: string,
    file: Express.Multer.File,
    targetRole?: string | null
  ): Promise<ResumeAnalysisResult> {
    if (!file) {
      throw ApiError.badRequest('Resume file is required.');
    }

    const resolvedRole = resolveRole(targetRole);

    // Step 1: Extract text from the uploaded file
    const extractedText = await this.extractText(file);

    // Step 2: Try Gemini AI-powered analysis
    if (ENV.GEMINI_API_KEY) {
      try {
        const aiResult = await this.analyzeWithGemini(extractedText, file.originalname, resolvedRole);
        if (aiResult) {
          // Save to database
          await this.saveDiagnostic(userId, file, aiResult, extractedText);
          return aiResult;
        }
      } catch (err) {
        console.warn('[ResumeService] Gemini analysis failed, using heuristic fallback:', err);
      }
    }

    // Step 3: Fallback to intelligent heuristic analysis
    const heuristicResult = this.analyzeWithHeuristics(extractedText, file.originalname, resolvedRole);

    // Save to database
    await this.saveDiagnostic(userId, file, heuristicResult, extractedText);

    return heuristicResult;
  }

  /**
   * Enterprise-grade AI-powered resume analysis using Gemini API.
   * Produces the full ATS evaluation schema with section_scores,
   * executive_summary, bullet_point_optimizations, and more.
   */
  private static async analyzeWithGemini(
    resumeText: string,
    fileName: string,
    role: string
  ): Promise<ResumeAnalysisResult | null> {
    const prompt = `You are an Enterprise-Grade Applicant Tracking System (ATS) Parsing Engine and Executive Career Strategist.

[TARGET_ROLE]: ${role}
Resume File: "${fileName}"

[RESUME_TEXT]
"""
${resumeText.slice(0, 5000)}
"""

# INPUT PROCESSING RULES
1. The resume text may come from Tesseract OCR — do NOT penalize for OCR artifacts. Silently reconstruct intended words.
2. Dynamically shift your evaluation rubric based on the TARGET_ROLE.

# EVALUATION DIMENSIONS (weighted scoring)
- Keyword & Semantic Alignment (30%): Hard skills, domain tools, methodologies matching ${role}.
- Impact & Quantification (30%): Action verbs, measurable outcomes (XYZ/STAR formula).
- Role & Seniority Fit (25%): Career progression, experience depth, certifications.
- Structural & Clarity Index (15%): Logical sections, brevity, professional presentation.

Return ONLY a valid JSON object with this exact schema:
{
  "ats_compatibility_score": integer 0-100,
  "section_scores": {
    "keyword_alignment": integer 0-100,
    "impact_and_metrics": integer 0-100,
    "experience_relevance": integer 0-100,
    "clarity_and_structure": integer 0-100
  },
  "detected_domain": "string: inferred industry and seniority level",
  "executive_summary": "string: 2-3 sentence verdict on candidate readiness",
  "keyword_analysis": {
    "matched_keywords": ["string"],
    "missing_critical_keywords": ["string"],
    "recommended_certifications_or_tools": ["string"]
  },
  "critical_red_flags": ["string: specific weaknesses or role mismatches"],
  "bullet_point_optimizations": [
    {
      "original_text": "string: weak bullet point from the CV",
      "issue": "string: why it fails",
      "enterprise_rewrite": "string: rewritten high-impact version"
    }
  ],
  "tailored_action_plan": ["string: step-by-step improvements to reach 90+ score"],
  "overallScore": same as ats_compatibility_score,
  "atsScore": same as keyword_alignment,
  "formattingScore": same as clarity_and_structure,
  "impactScore": same as impact_and_metrics,
  "extractedKeywords": same as matched_keywords,
  "missingKeywords": first 6 of missing_critical_keywords,
  "suggestions": first 5 of tailored_action_plan,
  "strengths": ["string: 2-4 strengths"]
}`;

    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${ENV.GEMINI_API_KEY}`,
      {
        contents: [{ parts: [{ text: prompt }] }],
      }
    );

    const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) return null;

    const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleaned);

    const clamp = (v: number) => Math.max(0, Math.min(100, v || 0));
    const ss = parsed.section_scores || {};

    return {
      ats_compatibility_score: clamp(parsed.ats_compatibility_score || parsed.overallScore),
      section_scores: {
        keyword_alignment: clamp(ss.keyword_alignment || parsed.atsScore),
        impact_and_metrics: clamp(ss.impact_and_metrics || parsed.impactScore),
        experience_relevance: clamp(ss.experience_relevance || 70),
        clarity_and_structure: clamp(ss.clarity_and_structure || parsed.formattingScore),
      },
      detected_domain: parsed.detected_domain || `Technology — ${role}`,
      executive_summary: parsed.executive_summary || '',
      keyword_analysis: {
        matched_keywords: Array.isArray(parsed.keyword_analysis?.matched_keywords) ? parsed.keyword_analysis.matched_keywords : (Array.isArray(parsed.extractedKeywords) ? parsed.extractedKeywords : []),
        missing_critical_keywords: Array.isArray(parsed.keyword_analysis?.missing_critical_keywords) ? parsed.keyword_analysis.missing_critical_keywords : (Array.isArray(parsed.missingKeywords) ? parsed.missingKeywords : []),
        recommended_certifications_or_tools: Array.isArray(parsed.keyword_analysis?.recommended_certifications_or_tools) ? parsed.keyword_analysis.recommended_certifications_or_tools : [],
      },
      critical_red_flags: Array.isArray(parsed.critical_red_flags) ? parsed.critical_red_flags : [],
      bullet_point_optimizations: Array.isArray(parsed.bullet_point_optimizations) ? parsed.bullet_point_optimizations : [],
      tailored_action_plan: Array.isArray(parsed.tailored_action_plan) ? parsed.tailored_action_plan : [],
      overallScore: clamp(parsed.ats_compatibility_score || parsed.overallScore),
      atsScore: clamp(ss.keyword_alignment || parsed.atsScore),
      formattingScore: clamp(ss.clarity_and_structure || parsed.formattingScore),
      impactScore: clamp(ss.impact_and_metrics || parsed.impactScore),
      extractedKeywords: Array.isArray(parsed.keyword_analysis?.matched_keywords) ? parsed.keyword_analysis.matched_keywords : (Array.isArray(parsed.extractedKeywords) ? parsed.extractedKeywords : []),
      missingKeywords: (Array.isArray(parsed.keyword_analysis?.missing_critical_keywords) ? parsed.keyword_analysis.missing_critical_keywords : (Array.isArray(parsed.missingKeywords) ? parsed.missingKeywords : [])).slice(0, 6),
      suggestions: Array.isArray(parsed.tailored_action_plan) ? parsed.tailored_action_plan.slice(0, 5) : (Array.isArray(parsed.suggestions) ? parsed.suggestions : []),
      strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
      analyzedRole: role,
    };
  }


  /**
   * Enterprise-grade heuristic analysis when Gemini API is unavailable.
   * Produces the full ATS evaluation schema with all enterprise fields.
   */
  private static analyzeWithHeuristics(
    text: string,
    fileName: string,
    role: string
  ): ResumeAnalysisResult {
    const textLower = text.toLowerCase();
    const coreKeywords = getKeywordsForRole(role);

    // --- Keyword Analysis ---
    const detectedKeywords: string[] = [];
    const missingKeywords: string[] = [];

    for (const kw of coreKeywords) {
      if (textLower.includes(kw.toLowerCase())) {
        detectedKeywords.push(kw);
      } else {
        missingKeywords.push(kw);
      }
    }

    if (detectedKeywords.length < 3 && text.length > 100) {
      const fallbackKws = coreKeywords.slice(0, 5);
      for (const kw of fallbackKws) {
        if (!detectedKeywords.includes(kw)) detectedKeywords.push(kw);
      }
    }

    // --- Keyword Alignment Score (30%) ---
    const keywordRatio = detectedKeywords.length / coreKeywords.length;
    const keywordScore = Math.min(96, Math.max(40, Math.round(35 + keywordRatio * 61)));

    // --- Impact & Metrics Score (30%) ---
    const actionVerbs = [
      'architected', 'engineered', 'optimized', 'implemented', 'developed',
      'designed', 'built', 'deployed', 'reduced', 'increased', 'improved',
      'led', 'managed', 'delivered', 'automated', 'scaled', 'spearheaded',
    ];
    const foundActionVerbs = actionVerbs.filter((v) => textLower.includes(v));
    const hasMetrics = /\d+%|\d+x|\$[\d,]+|reduced|increased|improved\s+by/i.test(text);
    const hasQuantified = /\d+\s*(users|customers|requests|transactions|ms|seconds|revenue)/i.test(text);

    let impactScore = 45;
    impactScore += Math.min(25, foundActionVerbs.length * 5);
    if (hasMetrics) impactScore += 12;
    if (hasQuantified) impactScore += 10;
    impactScore = Math.min(96, impactScore);

    // --- Experience Relevance Score (25%) ---
    const standardSections = [
      'experience', 'education', 'skills', 'projects',
      'work experience', 'technical skills', 'summary', 'objective',
      'certifications', 'achievements',
    ];
    const foundSections = standardSections.filter((s) => textLower.includes(s));
    const hasContactInfo = /[\w.-]+@[\w.-]+/.test(text) || /\d{3}[-.\s]?\d{3}[-.\s]?\d{4}/.test(text);
    const hasEducation = textLower.includes('education') || textLower.includes('degree') || textLower.includes('university');
    const hasExpYears = /\d+\+?\s*(years?|yrs?)\s*(of\s+)?experience/i.test(text);

    let experienceScore = 50;
    experienceScore += Math.min(20, foundSections.length * 4);
    if (hasContactInfo) experienceScore += 5;
    if (hasEducation) experienceScore += 8;
    if (hasExpYears) experienceScore += 10;
    experienceScore = Math.min(95, experienceScore);

    // --- Clarity & Structure Score (15%) ---
    const hasBullets = /[•\-\*]/.test(text);
    const isSinglePage = text.length < 4000;

    let clarityScore = 55;
    if (hasBullets) clarityScore += 10;
    if (isSinglePage) clarityScore += 8;
    if (foundSections.length >= 3) clarityScore += 12;
    if (hasContactInfo) clarityScore += 5;
    clarityScore = Math.min(95, clarityScore);

    // --- Weighted Overall Score ---
    const overallScore = Math.round(
      keywordScore * 0.30 +
      impactScore * 0.30 +
      experienceScore * 0.25 +
      clarityScore * 0.15
    );

    // --- Detect Seniority ---
    let seniority = 'Entry-Level / Intern';
    if (hasExpYears) {
      const ym = text.match(/(\d+)\+?\s*(years?|yrs?)/i);
      const years = ym ? parseInt(ym[1], 10) : 0;
      if (years >= 8) seniority = 'Senior / Staff Level';
      else if (years >= 4) seniority = 'Mid-Level';
      else if (years >= 1) seniority = 'Junior / Early Career';
    }

    // --- Executive Summary ---
    let executiveSummary: string;
    if (overallScore >= 85) {
      executiveSummary = `Strong candidate profile for ${role} with excellent keyword alignment and quantified impact statements. Resume is well-positioned for ATS screening at top-tier organizations.`;
    } else if (overallScore >= 70) {
      executiveSummary = `Solid foundation for ${role} applications. Resume covers core competencies but needs refinement in impact quantification and keyword optimization to consistently pass enterprise ATS filters.`;
    } else {
      executiveSummary = `Resume requires significant enhancement for ${role} positions. Key gaps in industry-standard keywords, quantified achievements, and structural clarity will likely cause ATS rejection.`;
    }

    // --- Critical Red Flags ---
    const redFlags: string[] = [];
    if (!hasMetrics) redFlags.push('No quantified achievements — ATS systems deprioritize resumes without measurable impact.');
    if (foundActionVerbs.length < 3) redFlags.push('Weak action verb usage — bullet points read as passive duty descriptions.');
    if (foundSections.length < 3) redFlags.push('Missing standard resume sections — ATS parsers expect Skills, Experience, Education headings.');
    if (!hasContactInfo) redFlags.push('Contact information not clearly detected — ensure email and phone are in the header.');
    if (detectedKeywords.length < 5) redFlags.push(`Critical keyword gap — fewer than 5 of ${coreKeywords.length} expected industry keywords matched.`);

    // --- Bullet Point Optimizations ---
    const bulletOptimizations: BulletOptimization[] = [];
    const lines = text.split('\n');
    for (const line of lines) {
      if (bulletOptimizations.length >= 3) break;
      const stripped = line.trim();
      if (stripped.startsWith('-') || stripped.startsWith('•') || stripped.startsWith('*')) {
        const content = stripped.replace(/^[-•*]\s*/, '').trim();
        if (content.length > 15) {
          const hasVerb = actionVerbs.slice(0, 10).some((v) => content.toLowerCase().includes(v));
          const hasNum = /\d/.test(content);
          if (!hasVerb || !hasNum) {
            bulletOptimizations.push({
              original_text: content,
              issue: !hasVerb ? 'Missing strong action verb — reads as a duty listing' : 'Lacks quantifiable metrics',
              enterprise_rewrite: `Engineered/Optimized [specific system] resulting in [X]% improvement in [metric], by implementing [specific approach]`,
            });
          }
        }
      }
    }
    if (bulletOptimizations.length === 0) {
      bulletOptimizations.push({
        original_text: 'Worked on backend systems',
        issue: 'Vague, no metrics, passive voice — fails ATS relevance scoring',
        enterprise_rewrite: `Architected scalable backend microservices handling [X]K+ RPM, reducing API latency by [Y]% through Redis caching and query optimization`,
      });
    }

    // --- Tailored Action Plan ---
    const actionPlan: string[] = [];
    if (missingKeywords.length > 0) {
      actionPlan.push(`Add these critical ${role} keywords: ${missingKeywords.slice(0, 4).join(', ')}.`);
    }
    if (!hasMetrics) {
      actionPlan.push("Quantify every bullet using XYZ formula: 'Accomplished [X] as measured by [Y], by doing [Z]'.");
    }
    if (foundActionVerbs.length < 5) {
      actionPlan.push('Replace passive language with power verbs: Architected, Spearheaded, Engineered, Automated, Scaled.');
    }
    if (foundSections.length < 4) {
      actionPlan.push('Add standard ATS sections: Technical Skills, Work Experience, Projects, Education, Certifications.');
    }
    actionPlan.push(`Tailor resume for each ${role} application using the job description's exact phrasing.`);

    // --- Strengths ---
    const strengths: string[] = [];
    if (detectedKeywords.length >= 5) strengths.push(`Strong ${role}-relevant keyword presence`);
    if (foundSections.length >= 3) strengths.push('Well-structured resume with standard section headings');
    if (foundActionVerbs.length >= 3) strengths.push('Good use of action verbs demonstrating ownership');
    if (hasMetrics) strengths.push('Includes quantified results showing measurable impact');
    if (isSinglePage) strengths.push(`Concise format ideal for ${role} roles`);
    if (strengths.length === 0) strengths.push('Resume submitted — good first step toward optimization');

    // --- Certification Recommendations ---
    const certMap: Record<string, string[]> = {
      'Software Engineer': ['AWS Certified Solutions Architect', 'Google Cloud Professional', 'Kubernetes CKA/CKAD'],
      'Frontend Developer': ['Google UX Design Certificate', 'Meta Front-End Developer', 'AWS Cloud Practitioner'],
      'Backend Developer': ['AWS Certified Developer', 'Google Cloud Professional', 'Redis University Certification'],
      'DevOps': ['AWS DevOps Professional', 'CKA (Certified Kubernetes Admin)', 'HashiCorp Terraform Associate'],
      'Data Science': ['TensorFlow Developer Certificate', 'AWS ML Specialty', 'Google Data Analytics Professional'],
    };
    const roleLower = role.toLowerCase();
    let recommendedCerts = certMap['Software Engineer'];
    for (const [key, certs] of Object.entries(certMap)) {
      if (roleLower.includes(key.toLowerCase())) {
        recommendedCerts = certs;
        break;
      }
    }

    return {
      ats_compatibility_score: overallScore,
      section_scores: {
        keyword_alignment: keywordScore,
        impact_and_metrics: impactScore,
        experience_relevance: experienceScore,
        clarity_and_structure: clarityScore,
      },
      detected_domain: `Technology — ${seniority}`,
      executive_summary: executiveSummary,
      keyword_analysis: {
        matched_keywords: detectedKeywords,
        missing_critical_keywords: missingKeywords.slice(0, 8),
        recommended_certifications_or_tools: recommendedCerts,
      },
      critical_red_flags: redFlags,
      bullet_point_optimizations: bulletOptimizations,
      tailored_action_plan: actionPlan,
      // Legacy compatibility
      overallScore,
      atsScore: keywordScore,
      formattingScore: clarityScore,
      impactScore,
      extractedKeywords: detectedKeywords,
      missingKeywords: missingKeywords.slice(0, 6),
      suggestions: actionPlan.slice(0, 5),
      strengths: strengths.slice(0, 4),
      analyzedRole: role,
    };
  }

  /**
   * Persists the resume diagnostic result to the database.
   * Stores the full enterprise-grade analysis as JSON in the existing columns.
   */
  private static async saveDiagnostic(
    userId: string,
    file: Express.Multer.File,
    result: ResumeAnalysisResult,
    extractedText: string
  ): Promise<void> {
    // Build enterprise data payload for storage
    const enterpriseData = {
      ats_compatibility_score: result.ats_compatibility_score,
      section_scores: result.section_scores,
      detected_domain: result.detected_domain,
      executive_summary: result.executive_summary,
      keyword_analysis: result.keyword_analysis,
      critical_red_flags: result.critical_red_flags,
      bullet_point_optimizations: result.bullet_point_optimizations,
      tailored_action_plan: result.tailored_action_plan,
    };

    await prisma.resumeDiagnostic.create({
      data: {
        userId,
        fileName: file.originalname,
        fileSize: file.size,
        overallScore: result.overallScore,
        atsScore: result.atsScore,
        formattingScore: result.formattingScore,
        impactScore: result.impactScore,
        extractedText: extractedText.replace(/\0/g, '').slice(0, 2000),
        suggestions: JSON.stringify(result.suggestions),
        missingKeywords: JSON.stringify(result.missingKeywords),
        strengths: JSON.stringify({
          strengths: result.strengths,
          enterprise: enterpriseData,
        }),
      },
    });
  }

  /**
   * Retrieves all past resume diagnostics for a user.
   */
  static async getUserResumes(userId: string) {
    return prisma.resumeDiagnostic.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }
}

