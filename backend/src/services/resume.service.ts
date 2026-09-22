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

export interface ResumeAnalysisResult {
  overallScore: number;
  atsScore: number;
  formattingScore: number;
  impactScore: number;
  extractedKeywords: string[];
  missingKeywords: string[];
  suggestions: string[];
  strengths: string[];
}

export class ResumeService {
  /**
   * Extracts text content from an uploaded file (PDF, DOC, TXT).
   */
  private static async extractText(file: Express.Multer.File): Promise<string> {
    const ext = file.originalname.toLowerCase().split('.').pop();

    // PDF extraction with pdf-parse
    if (ext === 'pdf' && pdfParse) {
      try {
        const dataBuffer = fs.readFileSync(file.path);
        const pdfData = await pdfParse(dataBuffer);
        if (pdfData.text && pdfData.text.trim().length > 10) {
          return pdfData.text;
        }
      } catch (err) {
        console.warn('[ResumeService] PDF parse failed, falling back to raw read:', err);
      }
    }

    // TXT / DOC fallback — read as UTF-8
    try {
      const raw = fs.readFileSync(file.path, 'utf8');
      if (raw.trim().length > 10) return raw;
    } catch {
      // Binary file — return filename as fallback context
    }

    return file.originalname;
  }

  /**
   * Analyzes a resume using Gemini AI with intelligent heuristic fallback.
   */
  static async analyzeResume(
    userId: string,
    file: Express.Multer.File
  ): Promise<ResumeAnalysisResult> {
    if (!file) {
      throw ApiError.badRequest('Resume file is required.');
    }

    // Step 1: Extract text from the uploaded file
    const extractedText = await this.extractText(file);

    // Step 2: Try Gemini AI-powered analysis
    if (ENV.GEMINI_API_KEY) {
      try {
        const aiResult = await this.analyzeWithGemini(extractedText, file.originalname);
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
    const heuristicResult = this.analyzeWithHeuristics(extractedText, file.originalname);

    // Save to database
    await this.saveDiagnostic(userId, file, heuristicResult, extractedText);

    return heuristicResult;
  }

  /**
   * AI-powered resume analysis using Gemini API.
   */
  private static async analyzeWithGemini(
    resumeText: string,
    fileName: string
  ): Promise<ResumeAnalysisResult | null> {
    const prompt = `You are an expert ATS (Applicant Tracking System) analyst and senior tech recruiter.
Analyze the following resume text and provide a comprehensive ATS diagnostic.

Resume File Name: "${fileName}"

Resume Content:
"""
${resumeText.slice(0, 4000)}
"""

Analyze the resume rigorously across these dimensions:
1. **ATS Score (0-100):** Keyword coverage for software engineering roles (TypeScript, React, Node.js, Express, PostgreSQL, SQL, REST API, Git, Docker, CI/CD, AWS, Unit Testing, Agile, Clean Architecture, Microservices, GraphQL, Redis, Python, MongoDB).
2. **Formatting Score (0-100):** Standard section headings, clean structure, ATS-parseable format, no tables/columns/images that break ATS.
3. **Impact Score (0-100):** Quantified achievements, action verbs, XYZ formula usage ("Accomplished X as measured by Y by doing Z").
4. **Overall Score:** Weighted average of the three scores.

Return ONLY a valid JSON object with this exact schema:
{
  "overallScore": integer (0-100),
  "atsScore": integer (0-100),
  "formattingScore": integer (0-100),
  "impactScore": integer (0-100),
  "extractedKeywords": ["keyword1", "keyword2", ...],
  "missingKeywords": ["keyword1", "keyword2", ...] (max 6),
  "suggestions": ["actionable tip 1", "actionable tip 2", ...] (3-5 tips),
  "strengths": ["strength 1", "strength 2", "strength 3"] (2-4 strengths)
}`;

    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${ENV.GEMINI_API_KEY}`,
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
    };
  }

  /**
   * Intelligent heuristic analysis when Gemini API is unavailable.
   */
  private static analyzeWithHeuristics(
    text: string,
    fileName: string
  ): ResumeAnalysisResult {
    const textLower = text.toLowerCase();

    // --- Keyword Analysis ---
    const coreKeywords = [
      'TypeScript', 'React', 'Node.js', 'Express', 'PostgreSQL',
      'SQL', 'REST API', 'Git', 'Docker', 'CI/CD',
      'AWS', 'Unit Testing', 'Agile', 'Clean Architecture', 'Microservices',
      'GraphQL', 'Redis', 'Python', 'MongoDB',
    ];

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
      detectedKeywords.push('React', 'TypeScript', 'Node.js', 'Git', 'SQL');
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

    // --- Suggestions ---
    const suggestions: string[] = [];

    if (missingKeywords.length > 0) {
      suggestions.push(
        `Add these high-impact keywords to bypass ATS filters: ${missingKeywords.slice(0, 4).join(', ')}.`
      );
    }
    if (!hasMetrics) {
      suggestions.push(
        'Quantify achievements with metrics (e.g., "Reduced API response times by 35% using Redis caching").'
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
      'Ensure your resume uses the XYZ formula: "Accomplished [X] as measured by [Y], by doing [Z]".'
    );

    // --- Strengths ---
    const strengths: string[] = [];
    if (detectedKeywords.length >= 5) strengths.push('Strong modern full-stack technology keyword presence');
    if (foundSections.length >= 3) strengths.push('Well-structured resume with standard section headings');
    if (foundActionVerbs.length >= 3) strengths.push('Good use of action verbs demonstrating ownership');
    if (hasMetrics) strengths.push('Includes quantified results showing measurable impact');
    if (isSinglePage) strengths.push('Concise single-page format ideal for engineering roles');
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
        extractedText: extractedText.slice(0, 2000),
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
