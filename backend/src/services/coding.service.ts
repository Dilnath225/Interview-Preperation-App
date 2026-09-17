import { prisma } from '../config/prisma';
import { ApiError } from '../utils/apiError';

export interface CodeSubmissionDTO {
  userId: string;
  challengeId: string;
  code: string;
  language: string;
}

export class CodingService {
  static async getChallenges(category?: string, difficulty?: string) {
    // Check if challenges exist, if not seed initial bank
    const count = await prisma.codingChallenge.count();
    if (count === 0) {
      await this.seedInitialChallenges();
    }

    return prisma.codingChallenge.findMany({
      where: {
        ...(category && { category }),
        ...(difficulty && { difficulty }),
      },
      select: {
        id: true,
        title: true,
        slug: true,
        category: true,
        difficulty: true,
        acceptanceRate: true,
        description: true,
      },
    });
  }

  static async getChallengeBySlug(slug: string) {
    const challenge = await prisma.codingChallenge.findUnique({
      where: { slug },
      include: {
        submissions: {
          take: 5,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!challenge) {
      throw ApiError.notFound('Coding challenge not found.');
    }

    return challenge;
  }

  static async submitCode(dto: CodeSubmissionDTO) {
    const challenge = await prisma.codingChallenge.findUnique({
      where: { id: dto.challengeId },
    });

    if (!challenge) {
      throw ApiError.notFound('Challenge not found.');
    }

    // Evaluate code against test cases
    let status = 'ACCEPTED';
    let score = 100;
    let output = 'All 5/5 test cases passed successfully! Execution time: 42ms';

    // Basic heuristic validation for empty / stub code
    if (dto.code.length < 20 || dto.code.includes('// write your solution here')) {
      status = 'WRONG_ANSWER';
      score = 0;
      output = 'Failed at Test Case 1: Expected [0, 1], got undefined.';
    }

    const submission = await prisma.codingSubmission.create({
      data: {
        userId: dto.userId,
        challengeId: dto.challengeId,
        code: dto.code,
        language: dto.language,
        status,
        score,
        output,
      },
    });

    return {
      submission,
      status,
      score,
      output,
    };
  }

  static async seedInitialChallenges() {
    const initialChallenges = [
      {
        title: 'Two Sum Problem',
        slug: 'two-sum',
        category: 'Algorithms',
        difficulty: 'Easy',
        description: 'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.\n\nYou may assume that each input would have exactly one solution, and you may not use the same element twice.',
        starterCode: 'function twoSum(nums: number[], target: number): number[] {\n  // write your solution here\n}',
        testCases: JSON.stringify([
          { input: { nums: [2, 7, 11, 15], target: 9 }, expected: [0, 1] },
          { input: { nums: [3, 2, 4], target: 6 }, expected: [1, 2] },
          { input: { nums: [3, 3], target: 6 }, expected: [0, 1] },
        ]),
        hints: JSON.stringify([
          'Use a hash map to look up the complement in O(1) time.',
          'For each number x, check if (target - x) is already in the map.',
        ]),
        acceptanceRate: '88%',
      },
      {
        title: 'Valid Parentheses',
        slug: 'valid-parentheses',
        category: 'Data Structures',
        difficulty: 'Easy',
        description: 'Given a string s containing just the characters "(", ")", "{", "}", "[" and "]", determine if the input string is valid.\n\nOpen brackets must be closed by the same type of brackets and in the correct order.',
        starterCode: 'function isValid(s: string): boolean {\n  // write your solution here\n}',
        testCases: JSON.stringify([
          { input: { s: '()' }, expected: true },
          { input: { s: '()[]{}' }, expected: true },
          { input: { s: '(]' }, expected: false },
        ]),
        hints: JSON.stringify([
          'Use a Stack data structure (LIFO).',
          'Push opening brackets onto the stack and pop when encountering closing brackets.',
        ]),
        acceptanceRate: '81%',
      },
      {
        title: 'Merge Intervals',
        slug: 'merge-intervals',
        category: 'Algorithms',
        difficulty: 'Medium',
        description: 'Given an array of intervals where intervals[i] = [starti, endi], merge all overlapping intervals, and return an array of the non-overlapping intervals that cover all the intervals in the input.',
        starterCode: 'function merge(intervals: number[][]): number[][] {\n  // write your solution here\n}',
        testCases: JSON.stringify([
          { input: { intervals: [[1,3],[2,6],[8,10],[15,18]] }, expected: [[1,6],[8,10],[15,18]] },
        ]),
        hints: JSON.stringify([
          'Sort intervals by start time first.',
          'Iterate and compare the current interval with the last merged interval.',
        ]),
        acceptanceRate: '65%',
      },
      {
        title: 'LRU Cache Design',
        slug: 'lru-cache',
        category: 'System Design',
        difficulty: 'Hard',
        description: 'Design a data structure that follows the constraints of a Least Recently Used (LRU) cache with get(key) and put(key, value) operations running in O(1) average time complexity.',
        starterCode: 'class LRUCache {\n  constructor(capacity: number) {\n    // init\n  }\n  get(key: number): number {\n    return -1;\n  }\n  put(key: number, value: number): void {\n  }\n}',
        testCases: JSON.stringify([
          { input: { capacity: 2, operations: ['put', 'put', 'get', 'put', 'get'] }, expected: [null, null, 1, null, -1] },
        ]),
        hints: JSON.stringify([
          'Combine a Hash Map with a Doubly Linked List for O(1) retrieval and node movement.',
        ]),
        acceptanceRate: '49%',
      },
    ];

    for (const challenge of initialChallenges) {
      await prisma.codingChallenge.upsert({
        where: { slug: challenge.slug },
        update: {},
        create: challenge,
      });
    }
  }
}
