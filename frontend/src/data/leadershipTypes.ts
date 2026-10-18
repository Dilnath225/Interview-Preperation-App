export interface MCQOption {
  id: 'A' | 'B' | 'C' | 'D';
  text: string;
}

export interface LeadershipQuestion {
  id: number;
  category: string;
  scenario: string;
  options: MCQOption[];
  correctOption: 'A' | 'B' | 'C' | 'D';
  explanation: string;
}

export interface LeadershipPaper {
  id: string;
  paperNumber: number;
  title: string;
  level: 'Internship' | 'Junior' | 'Mid' | 'Senior' | 'Enterprise';
  levelBadge: string;
  description: string;
  timeEstimateMinutes: number;
  questionsCount: number;
  questions: LeadershipQuestion[];
}
