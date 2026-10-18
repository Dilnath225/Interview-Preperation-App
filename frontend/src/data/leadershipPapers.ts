export * from './leadershipTypes';
import { LeadershipPaper } from './leadershipTypes';

import { paper1Questions } from '@/data/leadershipPaper1';
import { paper2Questions } from '@/data/leadershipPaper2';
import { paper3Questions } from '@/data/leadershipPaper3';
import { paper4Questions } from '@/data/leadershipPaper4';
import { paper5Questions } from '@/data/leadershipPaper5';

export const LEADERSHIP_PAPERS: LeadershipPaper[] = [
  {
    id: 'paper-1',
    paperNumber: 1,
    title: 'Workplace Team Dynamics & Task Ownership',
    level: 'Internship',
    levelBadge: 'Internship & Associate',
    description: '40 foundational scenarios on taking accountability, asking for help, peer code review etiquette, receiving constructive feedback, and active listening.',
    timeEstimateMinutes: 90,
    questionsCount: 40,
    questions: paper1Questions,
  },
  {
    id: 'paper-2',
    paperNumber: 2,
    title: 'Collaborative Problem Solving & Agile Ownership',
    level: 'Junior',
    levelBadge: 'Junior / Mid-Level',
    description: '40 scenarios on managing sprint commitments, handling scope ambiguity, balancing refactoring vs shipping, and proactive issue escalation.',
    timeEstimateMinutes: 90,
    questionsCount: 40,
    questions: paper2Questions,
  },
  {
    id: 'paper-3',
    paperNumber: 3,
    title: 'Conflict Resolution & Stakeholder Negotiation',
    level: 'Mid',
    levelBadge: 'Mid / Senior Level',
    description: '40 scenarios on negotiating deadlines with Product Managers, disagree-and-commit principles, cross-team API contracts, and mitigating teammate friction.',
    timeEstimateMinutes: 90,
    questionsCount: 40,
    questions: paper3Questions,
  },
  {
    id: 'paper-4',
    paperNumber: 4,
    title: 'Engineering Team Leadership & Mentorship',
    level: 'Senior',
    levelBadge: 'Senior & Tech Lead',
    description: '40 scenarios on delegation vs micromanagement, leading 1-on-1s, driving architectural standards (ADRs), and coaching underperforming engineers.',
    timeEstimateMinutes: 90,
    questionsCount: 40,
    questions: paper4Questions,
  },
  {
    id: 'paper-5',
    paperNumber: 5,
    title: 'Enterprise Vision, Board Alignment & Crisis Governance',
    level: 'Enterprise',
    levelBadge: 'Enterprise / Director',
    description: '40 executive scenarios on managing P0 outage communications, multi-department budget trade-offs, psychological safety culture, and organizational transformation.',
    timeEstimateMinutes: 90,
    questionsCount: 40,
    questions: paper5Questions,
  },
];
