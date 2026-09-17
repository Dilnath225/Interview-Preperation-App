/**
 * AI Mentor - Data Models and Interfaces
 */

export interface UserProfile {
  name: string;
  role: string;
  avatarUrl?: string;
  readinessScore: number;
  level: number;
  preferredJobRole: string;
  skills: string[];
}

export interface DailyProgress {
  percentage: number;
  topPercent: number;
  status: 'ON TRACK' | 'NEEDS ATTENTION' | 'BEHIND';
}

export interface RecommendedDrill {
  id: string;
  type: 'BEHAVIORAL' | 'LEADERSHIP' | 'TECHNICAL' | 'SYSTEM DESIGN';
  title: string;
  durationMinutes: number;
  category: string;
}

export interface UpcomingSession {
  id: string;
  title: string;
  date: string; // e.g. "OCT 24"
  time: string; // e.g. "2:00 PM"
  mentor: string;
}

export interface InterviewCategory {
  id: string;
  title: string;
  description: string;
  icon: string;
  badge?: string;
  fullWidth?: boolean;
}

export interface QuestionData {
  id: string;
  category: string;
  index: number;
  total: number;
  question: string;
  hints?: string[];
}

export interface ResumeAnalysisResult {
  score: number;
  atsReadiness: {
    formatting: boolean;
    keywords: boolean;
    contactInfo: boolean;
  };
  criticalGaps: Array<{
    id: string;
    title: string;
    description: string;
  }>;
}

export interface ChatMessage {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  timestamp: string;
}

export interface CodingProblem {
  id: string;
  title: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  timeRemainingMinutes: number;
  description: string;
  initialCode: string;
}
