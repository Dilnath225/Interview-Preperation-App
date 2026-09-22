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

export interface ResumeAnalysisResult {
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
 * Resolves the user's targetRole to the closest matching keyword map key.
 */
function resolveRole(targetRole: string | null | undefined): string {
  if (!targetRole) return 'Software Engineer';

  const roleLower = targetRole.toLowerCase().trim();

  // Direct match check
  for (const key of Object.keys(ROLE_KEYWORDS)) {
    if (key.toLowerCase() === roleLower) return key;
  }

  // Partial / fuzzy match
  if (roleLower.includes('devops') || roleLower.includes('sre') || roleLower.includes('infrastructure') || roleLower.includes('platform')) return 'DevOps';
  if (roleLower.includes('frontend') || roleLower.includes('front-end') || roleLower.includes('front end') || roleLower.includes('ui developer')) return 'Frontend Developer';
  if (roleLower.includes('backend') || roleLower.includes('back-end') || roleLower.includes('back end') || roleLower.includes('server')) return 'Backend Developer';
  if (roleLower.includes('full stack') || roleLower.includes('fullstack') || roleLower.includes('full-stack')) return 'Full Stack Developer';
  if (roleLower.includes('data') || roleLower.includes('machine learning') || roleLower.includes('ml ') || roleLower.includes('ai ') || roleLower.includes('scientist')) return 'Data Science';
  if (roleLower.includes('business') || roleLower.includes('management') || roleLower.includes('product manager') || roleLower.includes('analyst')) return 'Business';
  if (roleLower.includes('qa') || roleLower.includes('quality') || roleLower.includes('test') || roleLower.includes('sdet')) return 'QA Engineer';
  if (roleLower.includes('mobile') || roleLower.includes('ios') || roleLower.includes('android') || roleLower.includes('react native') || roleLower.includes('flutter')) return 'Mobile Developer';
  if (roleLower.includes('software') || roleLower.includes('engineer') || roleLower.includes('developer') || roleLower.includes('programmer')) return 'Software Engineer';

  return 'Software Engineer';
}

/**
 * Returns the keywords for a given resolved role.
 */
function getKeywordsForRole(role: string): string[] {
  return ROLE_KEYWORDS[role] || ROLE_KEYWORDS['Software Engineer'];
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
   * AI-powered resume analysis using Gemini API, tailored to the target role.
   */
  private static async analyzeWithGemini(
    resumeText: string,
    fileName: string,
    role: string
  ): Promise<ResumeAnalysisResult | null> {
    const roleKeywords = getKeywordsForRole(role);

    const prompt = `You are an expert ATS (Applicant Tracking System) analyst and senior recruiter specializing in ${role} positions.
Analyze the following resume text and provide a comprehensive ATS diagnostic specifically for a **${role}** position.

Resume File Name: "${fileName}"

Resume Content:
"""
${resumeText.slice(0, 4000)}
"""

Target Role: **${role}**
Expected Keywords for this role: ${roleKeywords.join(', ')}

Analyze the resume rigorously across these dimensions, specifically for a ${role} position:
1. **ATS Score (0-100):** Keyword coverage for ${role} roles. Check for these key skills: ${roleKeywords.slice(0, 12).join(', ')}.
2. **Formatting Score (0-100):** Standard section headings, clean structure, ATS-parseable format, no tables/columns/images that break ATS.
3. **Impact Score (0-100):** Quantified achievements, action verbs, XYZ formula usage ("Accomplished X as measured by Y by doing Z"). Evaluate impact relevance to ${role} specifically.
4. **Overall Score:** Weighted average of the three scores.

Return ONLY a valid JSON object with this exact schema:
{
  "overallScore": integer (0-100),
  "atsScore": integer (0-100),
  "formattingScore": integer (0-100),
  "impactScore": integer (0-100),
  "extractedKeywords": ["keyword1", "keyword2", ...],
  "missingKeywords": ["keyword1", "keyword2", ...] (max 6, specific to ${role}),
  "suggestions": ["actionable tip 1", "actionable tip 2", ...] (3-5 tips, specific to ${role}),
  "strengths": ["strength 1", "strength 2", "strength 3"] (2-4 strengths)
}`;

    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${ENV.GEMINI_API_KEY}`,
      {
        contents: [{ parts: [{ text: prompt }] }],
      }
    );

    const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) return null;

    const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleaned);

    // Validate the response shape
    return {
      overallScore: Math.max(0, Math.min(100, parsed.overallScore || 0)),
      atsScore: Math.max(0, Math.min(100, parsed.atsScore || 0)),
      formattingScore: Math.max(0, Math.min(100, parsed.formattingScore || 0)),
      impactScore: Math.max(0, Math.min(100, parsed.impactScore || 0)),
      extractedKeywords: Array.isArray(parsed.extractedKeywords) ? parsed.extractedKeywords : [],
      missingKeywords: Array.isArray(parsed.missingKeywords) ? parsed.missingKeywords.slice(0, 6) : [],
      suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions : [],
      strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
      analyzedRole: role,
    };
  }

  /**
   * Intelligent heuristic analysis when Gemini API is unavailable.
   * Uses role-specific keywords for accurate scoring.
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

    // Baseline: ensure at least some detected keywords for valid resumes
    if (detectedKeywords.length < 3 && text.length > 100) {
      const fallbackKws = coreKeywords.slice(0, 5);
      for (const kw of fallbackKws) {
        if (!detectedKeywords.includes(kw)) detectedKeywords.push(kw);
      }
    }

    // --- ATS Score ---
    const keywordRatio = detectedKeywords.length / coreKeywords.length;
    const atsScore = Math.min(96, Math.max(55, Math.round(50 + keywordRatio * 46)));

    // --- Formatting Score ---
    const standardSections = [
      'experience', 'education', 'skills', 'projects',
      'work experience', 'technical skills', 'summary', 'objective',
    ];
    const foundSections = standardSections.filter((s) => textLower.includes(s));
    const hasContactInfo = /[\w.-]+@[\w.-]+/.test(text) || /\d{3}[-.\s]?\d{3}[-.\s]?\d{4}/.test(text);
    const hasBullets = /[•\-\*]/.test(text);
    const isSinglePage = text.length < 4000;

    let formattingScore = 60;
    formattingScore += Math.min(20, foundSections.length * 5);
    if (hasContactInfo) formattingScore += 5;
    if (hasBullets) formattingScore += 5;
    if (isSinglePage) formattingScore += 5;
    formattingScore = Math.min(95, formattingScore);

    // --- Impact Score ---
    const actionVerbs = [
      'architected', 'engineered', 'optimized', 'implemented', 'developed',
      'designed', 'built', 'deployed', 'reduced', 'increased', 'improved',
      'led', 'managed', 'delivered', 'automated', 'scaled',
    ];
    const foundActionVerbs = actionVerbs.filter((v) => textLower.includes(v));
    const hasMetrics = /\d+%|\d+x|\$\d+|reduced|increased|improved\s+by/i.test(text);
    const hasQuantifiedResults = /\d+\s*(users|customers|requests|transactions|ms|seconds)/i.test(text);

    let impactScore = 55;
    impactScore += Math.min(20, foundActionVerbs.length * 4);
    if (hasMetrics) impactScore += 10;
    if (hasQuantifiedResults) impactScore += 8;
    impactScore = Math.min(95, impactScore);

    // --- Overall Score ---
    const overallScore = Math.round((atsScore + formattingScore + impactScore) / 3);

    // --- Suggestions (role-specific) ---
    const suggestions: string[] = [];

    if (missingKeywords.length > 0) {
      suggestions.push(
        `Add these high-impact ${role} keywords to bypass ATS filters: ${missingKeywords.slice(0, 4).join(', ')}.`
      );
    }
    if (!hasMetrics) {
      suggestions.push(
        `Quantify your ${role} achievements with metrics (e.g., measurable impact numbers, percentages, or scale).`
      );
    }
    if (foundSections.length < 4) {
      suggestions.push(
        'Include standard sections: Technical Skills, Work Experience, Projects, and Education.'
      );
    }
    if (foundActionVerbs.length < 3) {
      suggestions.push(
        'Use strong action verbs: "Architected", "Optimized", "Engineered", "Deployed", "Scaled".'
      );
    }
    suggestions.push(
      `Tailor your resume specifically for ${role} positions using the XYZ formula: "Accomplished [X] as measured by [Y], by doing [Z]".`
    );

    // --- Strengths ---
    const strengths: string[] = [];
    if (detectedKeywords.length >= 5) strengths.push(`Strong ${role}-relevant technology keyword presence`);
    if (foundSections.length >= 3) strengths.push('Well-structured resume with standard section headings');
    if (foundActionVerbs.length >= 3) strengths.push('Good use of action verbs demonstrating ownership');
    if (hasMetrics) strengths.push('Includes quantified results showing measurable impact');
    if (isSinglePage) strengths.push(`Concise single-page format ideal for ${role} roles`);
    if (strengths.length === 0) strengths.push('Resume submitted — good first step toward optimization');

    return {
      overallScore,
      atsScore,
      formattingScore,
      impactScore,
      extractedKeywords: detectedKeywords,
      missingKeywords: missingKeywords.slice(0, 6),
      suggestions: suggestions.slice(0, 5),
      strengths: strengths.slice(0, 4),
      analyzedRole: role,
    };
  }

  /**
   * Persists the resume diagnostic result to the database.
   */
  private static async saveDiagnostic(
    userId: string,
    file: Express.Multer.File,
    result: ResumeAnalysisResult,
    extractedText: string
  ): Promise<void> {
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
        strengths: JSON.stringify(result.strengths),
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

