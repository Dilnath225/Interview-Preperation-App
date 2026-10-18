/**
 * Tech Giants (Global & Sri Lanka) and Current Job Openings Data
 * Calibrated corporate hiring benchmarks, tech stacks, and modern recruitment roles.
 */

export interface TechCompany {
  id: string;
  name: string;
  shortName: string;
  category: 'global' | 'srilanka';
  logoIcon: string;
  logoColor: string;
  logoBg: string;
  matchScore: number;
  badge?: string;
  badgeColor?: string;
  title: string;
  subtitle: string;
  statsText: string;
  techStacks: string[];
  headquarters: string;
  overview: string;
  interviewRounds: Array<{
    round: string;
    title: string;
    description: string;
    duration: string;
  }>;
  keyQuestionThemes: string[];
}

export interface JobOpening {
  id: string;
  companyId: string;
  companyName: string;
  region: 'srilanka' | 'global' | 'remote';
  title: string;
  location: string;
  workplaceType: 'Remote' | 'Hybrid' | 'On-site';
  experienceLevel: string;
  salaryRange?: string;
  postedDate: string;
  badge?: string;
  techStacks: string[];
  department: string;
  description: string;
  responsibilities: string[];
  requirements: string[];
  interviewStages: string[];
}

export const TECH_COMPANIES: TechCompany[] = [
  // -------------------------------------------------------------
  // GLOBAL TECH GIANTS
  // -------------------------------------------------------------
  {
    id: 'google',
    name: 'Google',
    shortName: 'Google',
    category: 'global',
    logoIcon: 'logo-google',
    logoColor: '#4285F4',
    logoBg: 'rgba(66, 133, 244, 0.14)',
    matchScore: 95,
    title: 'Google Interview Prep',
    subtitle: 'Distributed systems, high-speed algorithms, and Googleyness & Leadership.',
    statsText: '200+ Questions • 45m L5 Simulation',
    techStacks: ['Go', 'Java', 'C++', 'Python', 'Kubernetes', 'GCP', 'BigQuery', 'Spanner'],
    headquarters: 'Mountain View, California, USA',
    overview:
      'Google interview loops evaluate algorithmic fluency (DSA), distributed systems scalability, and Googleyness (intellectual humility, collaboration, and bias to action).',
    interviewRounds: [
      {
        round: 'Round 1',
        title: 'Recruiter & Technical Phone Screen',
        description: 'Data structures, algorithm complexity analysis, and live coding via Google Docs / CoderPad.',
        duration: '45 mins',
      },
      {
        round: 'Round 2 & 3',
        title: 'Onsite Coding & Algorithms (DSA)',
        description: 'Advanced graph traversal, dynamic programming, tree manipulation, and space-time optimization.',
        duration: '2 x 45 mins',
      },
      {
        round: 'Round 4',
        title: 'System Design & Scalability',
        description: 'Architecting globally distributed, fault-tolerant platforms (e.g. YouTube CDN, Google Drive sync).',
        duration: '60 mins',
      },
      {
        round: 'Round 5',
        title: 'Googleyness & Leadership',
        description: 'Ambiguity handling, navigating ethical dilemmas, cross-functional empathy, and continuous learning.',
        duration: '45 mins',
      },
    ],
    keyQuestionThemes: [
      'Design a distributed rate limiter for 100M QPS',
      'Optimize cache invalidation in multi-region clusters',
      'Longest substring with K distinct characters in O(N)',
      'Explain a time you navigated severe architectural ambiguity',
    ],
  },
  {
    id: 'amazon',
    name: 'Amazon',
    shortName: 'Amazon',
    category: 'global',
    logoIcon: 'cart-outline',
    logoColor: '#FF9900',
    logoBg: 'rgba(255, 153, 0, 0.14)',
    matchScore: 88,
    badge: 'LEADERSHIP PRINCIPLES',
    badgeColor: '#00E676',
    title: 'Amazon Prep',
    subtitle: 'Focus on SDE-II system design, high availability, and 16 Leadership Principles.',
    statsText: '148 SCENARIOS • 88% SYNC',
    techStacks: ['Java', 'AWS', 'DynamoDB', 'EventBridge', 'Microservices', 'TypeScript'],
    headquarters: 'Seattle, Washington, USA',
    overview:
      'Every Amazon interview round tests both technical mastery and 2-3 specific Leadership Principles (Customer Obsession, Ownership, Bias for Action, Dive Deep).',
    interviewRounds: [
      {
        round: 'Round 1',
        title: 'Online Assessment (OA)',
        description: '2 algorithmic coding challenges + Work Simulation assessment + LP survey.',
        duration: '90 mins',
      },
      {
        round: 'Round 2',
        title: 'Technical Screen (Live Coding)',
        description: 'Live coding on LeetCode Medium/Hard topics with strict STAR behavioral questioning.',
        duration: '60 mins',
      },
      {
        round: 'Round 3 & 4',
        title: 'The Onsite Loop (System Design & Code)',
        description: 'High-scale service architecture using AWS components, API contracts, and edge failure modes.',
        duration: '2 x 60 mins',
      },
      {
        round: 'Round 5',
        title: 'The Bar Raiser',
        description: 'Independent interviewer outside the hiring team evaluating whether candidate raises Amazon hiring bar.',
        duration: '60 mins',
      },
    ],
    keyQuestionThemes: [
      'Tell me about a time you made an architectural decision without consensus',
      'Design Amazon Locker distributed fulfillment service',
      'LRU Cache implementation with concurrency locks',
      'Describe a time you refused to compromise quality for deadlines',
    ],
  },
  {
    id: 'microsoft',
    name: 'Microsoft',
    shortName: 'Microsoft',
    category: 'global',
    logoIcon: 'grid-outline',
    logoColor: '#00A4EF',
    logoBg: 'rgba(0, 164, 239, 0.14)',
    matchScore: 89,
    title: 'Microsoft Prep',
    subtitle: 'Azure enterprise cloud, C#/.NET Core, and growth mindset behavioral drills.',
    statsText: '160 SCENARIOS • 45m Loop',
    techStacks: ['C#', '.NET 8', 'Azure', 'TypeScript', 'CosmosDB', 'SQL Server', 'React'],
    headquarters: 'Redmond, Washington, USA',
    overview:
      'Microsoft emphasizes Growth Mindset, enterprise durability, clean asynchronous code, and modern cloud deployment patterns on Azure.',
    interviewRounds: [
      {
        round: 'Round 1',
        title: 'CoderPad Technical Screen',
        description: 'Data structures, string parsing, matrix traversal, and modular object-oriented design.',
        duration: '45 mins',
      },
      {
        round: 'Round 2',
        title: 'Object-Oriented Design & DSA',
        description: 'Designing maintainable domain models with SOLID principles and algorithmic speed.',
        duration: '45 mins',
      },
      {
        round: 'Round 3',
        title: 'Cloud System Architecture',
        description: 'Multi-tenant cloud architecture, Azure CosmosDB partitioning, and zero-downtime upgrades.',
        duration: '60 mins',
      },
      {
        round: 'Round 4',
        title: 'Partner Manager & Growth Mindset',
        description: 'Strategic vision, handling architectural mistakes, team mentorship, and culture alignment.',
        duration: '45 mins',
      },
    ],
    keyQuestionThemes: [
      'Design a collaborative document editor like MS Word Online',
      'Implement asynchronous thread-safe message queue in C#',
      'Describe a time a product launch failed and how you extracted learnings',
    ],
  },
  {
    id: 'meta',
    name: 'Meta',
    shortName: 'Meta',
    category: 'global',
    logoIcon: 'infinite-outline',
    logoColor: '#0668E1',
    logoBg: 'rgba(6, 104, 225, 0.14)',
    matchScore: 91,
    title: 'Meta Prep',
    subtitle: 'Product architecture, fast-paced DSA, and behavioural E5 engineering loops.',
    statsText: '120 SCENARIOS • 45m E5 Mock',
    techStacks: ['React', 'Python', 'C++', 'Hack/PHP', 'GraphQL', 'Cassandra', 'Kafka'],
    headquarters: 'Menlo Park, California, USA',
    overview:
      'Meta tests rapid problem breakdown under time pressure. Two medium/hard algorithmic problems must be completed cleanly in 45 minutes.',
    interviewRounds: [
      {
        round: 'Round 1',
        title: 'Technical Phone Screen',
        description: '2 algorithmic coding problems solved and verified in 45 minutes flat.',
        duration: '45 mins',
      },
      {
        round: 'Round 2 & 3',
        title: 'Coding Rounds (Onsite)',
        description: 'Trees, heaps, BFS/DFS, binary search, and prefix sums with bug-free code.',
        duration: '2 x 45 mins',
      },
      {
        round: 'Round 4',
        title: 'Product Architecture / Systems',
        description: 'End-to-end architecture (e.g. Instagram Live Feed, WhatsApp messaging backend).',
        duration: '45 mins',
      },
      {
        round: 'Round 5',
        title: 'Behavioral & Leadership Loop',
        description: 'Navigating rapid roadmap pivots, disagree and commit, and mentoring junior engineers.',
        duration: '45 mins',
      },
    ],
    keyQuestionThemes: [
      'Design WhatsApp real-time delivery receipt architecture',
      'Kth largest element in an unsorted stream in O(N log K)',
      'How do you handle ambiguous requirements under hyper-growth deadlines?',
    ],
  },
  {
    id: 'netflix',
    name: 'Netflix',
    shortName: 'Netflix',
    category: 'global',
    logoIcon: 'play-outline',
    logoColor: '#E50914',
    logoBg: 'rgba(229, 9, 20, 0.14)',
    matchScore: 72,
    badge: 'FREEDOM & RESPONSIBILITY',
    badgeColor: '#E50914',
    title: 'Netflix Culture Fit',
    subtitle: '"Freedom & Responsibility" drills, high context, low control, and microservices.',
    statsText: '72% MASTERY • Senior Loop',
    techStacks: ['Java', 'Spring Boot', 'AWS', 'Kafka', 'gRPC', 'Distributed Tracing', 'Node.js'],
    headquarters: 'Los Gatos, California, USA',
    overview:
      'Netflix hires predominantly Senior Engineers and places unmatched emphasis on their Culture Memo: Freedom & Responsibility, Radical Candor, and High Performance.',
    interviewRounds: [
      {
        round: 'Round 1',
        title: 'Initial Technical & Cultural Screen',
        description: 'Deep dive into past production outages, system architecture, and culture alignment.',
        duration: '45 mins',
      },
      {
        round: 'Round 2',
        title: 'Distributed Systems Deep-Dive',
        description: 'Failure resilience, chaos engineering, edge caching, and traffic shedding patterns.',
        duration: '60 mins',
      },
      {
        round: 'Round 3',
        title: 'Engineering Leadership & Culture Part 1',
        description: 'Director/VP interview probing your ability to give and receive direct critical feedback.',
        duration: '45 mins',
      },
      {
        round: 'Round 4',
        title: 'Culture Part 2 & Compensation',
        description: 'Alignment with top-of-market compensation philosophy and autonomous decision making.',
        duration: '45 mins',
      },
    ],
    keyQuestionThemes: [
      'How would you handle a colleague who is technically brilliant but corrosive to team culture?',
      'Design video streaming adaptive bitrate encoding pipeline',
      'Explain how you would chaos-test microservice dependency failures',
    ],
  },

  // -------------------------------------------------------------
  // SRI LANKAN TECH GIANTS & LEADERS
  // -------------------------------------------------------------
  {
    id: 'wso2',
    name: 'WSO2',
    shortName: 'WSO2',
    category: 'srilanka',
    logoIcon: 'cloud-outline',
    logoColor: '#FF7300',
    logoBg: 'rgba(255, 115, 0, 0.14)',
    matchScore: 94,
    badge: 'API & CLOUD NATIVE',
    badgeColor: '#FF7300',
    title: 'WSO2 Enterprise Prep',
    subtitle: 'Integration, Ballerina, Cloud Native microservices, and Choreo / Asgardeo focus.',
    statsText: '140 SCENARIOS • Colombo & Remote',
    techStacks: ['Java', 'Ballerina', 'Go', 'Kubernetes', 'Docker', 'OAuth2/OIDC', 'Envoy', 'gRPC'],
    headquarters: 'Colombo, Sri Lanka & Santa Clara, USA',
    overview:
      'WSO2 is a global pioneer in open-source API management, enterprise integration, identity access management (IAM), and Internal Developer Platforms (Choreo).',
    interviewRounds: [
      {
        round: 'Round 1',
        title: 'Technical Aptitude & Core Concepts',
        description: 'Multi-threading in Java/Go, network protocols (HTTP/2, gRPC), and data structures.',
        duration: '45 mins',
      },
      {
        round: 'Round 2',
        title: 'Take-Home / Live Architecture Assignment',
        description: 'Building a microservice integration, API gateway proxy, or custom Ballerina connector.',
        duration: '60 mins',
      },
      {
        round: 'Round 3',
        title: 'System Design & Distributed Systems',
        description: 'High-throughput API token validation, rate-limiting clusters, and Kubernetes ingress.',
        duration: '60 mins',
      },
      {
        round: 'Round 4',
        title: 'Director / Culture Fit Interview',
        description: 'Open-source ethos, technical curiosity, engineering ownership, and communication.',
        duration: '45 mins',
      },
    ],
    keyQuestionThemes: [
      'Explain how OAuth2 authorization code flow with PKCE works in Asgardeo',
      'Design a resilient API Gateway that handles 50,000 requests/sec with JWT caching',
      'How does Ballerina concurrency and worker model differ from Java threads?',
      'Explain circuit breaker pattern implementation in distributed service mesh',
    ],
  },
  {
    id: 'ifs',
    name: 'IFS Sri Lanka',
    shortName: 'IFS',
    category: 'srilanka',
    logoIcon: 'cube-outline',
    logoColor: '#7C4DFF',
    logoBg: 'rgba(124, 77, 255, 0.14)',
    matchScore: 90,
    badge: 'GLOBAL ERP & CLOUD',
    badgeColor: '#7C4DFF',
    title: 'IFS Cloud Enterprise Prep',
    subtitle: 'Industrial AI, ERP platform design, C#, React, and enterprise cloud scalability.',
    statsText: '115 SCENARIOS • Orion City Colombo',
    techStacks: ['C#', '.NET Core', 'React', 'Azure', 'Oracle Database', 'PL/SQL', 'Docker', 'Kubernetes'],
    headquarters: 'Linköping, Sweden (Largest R&D in Colombo, Sri Lanka)',
    overview:
      'IFS develops mission-critical Enterprise Cloud software (ERP, FSM, EAM) for global aerospace, defense, and manufacturing giants, with its primary global R&D powerhouse in Colombo.',
    interviewRounds: [
      {
        round: 'Round 1',
        title: 'Technical Screen & OOP Evaluation',
        description: 'C# / .NET Core internals, asynchronous programming (async/await), and relational schema design.',
        duration: '45 mins',
      },
      {
        round: 'Round 2',
        title: 'Full Stack & Framework Evaluation',
        description: 'React state lifecycle, RESTful API contract design, and Oracle query optimization.',
        duration: '60 mins',
      },
      {
        round: 'Round 3',
        title: 'Enterprise Architecture & Cloud Scalability',
        description: 'Multi-tenant cloud data isolation, database index tuning, and microservice modularity.',
        duration: '60 mins',
      },
      {
        round: 'Round 4',
        title: 'Management & Behavioral Alignment',
        description: 'Global cross-team collaboration (Nordics/UK), handling enterprise client expectations.',
        duration: '45 mins',
      },
    ],
    keyQuestionThemes: [
      'How do you design multi-tenant database isolation in IFS Cloud?',
      'Explain query plan optimization for large relational tables in Oracle/PostgreSQL',
      'Difference between optimistic and pessimistic locking in enterprise ERP inventory transactions',
      'Describe a scenario where you migrated a legacy monolith feature to modern microservices',
    ],
  },
  {
    id: 'syscolabs',
    name: 'Sysco LABS',
    shortName: 'Sysco LABS',
    category: 'srilanka',
    logoIcon: 'restaurant-outline',
    logoColor: '#00B0FF',
    logoBg: 'rgba(0, 176, 255, 0.14)',
    matchScore: 92,
    badge: 'FORTUNE 50 ENTERPRISE',
    badgeColor: '#00B0FF',
    title: 'Sysco LABS Prep',
    subtitle: 'Global foodservice scale, microservices, AWS, and distributed event-driven data.',
    statsText: '130 SCENARIOS • Colombo & Texas',
    techStacks: ['Java', 'Spring Boot', 'Node.js', 'AWS', 'Kafka', 'TypeScript', 'Terraform', 'PostgreSQL'],
    headquarters: 'Houston, Texas (Innovation Center in Colombo, Sri Lanka)',
    overview:
      'Sysco LABS powers the digital core of Sysco, the Fortune 50 world leader in foodservice distribution, driving billions of dollars in daily international logistics and commerce.',
    interviewRounds: [
      {
        round: 'Round 1',
        title: 'Coding & Algorithmic Problem Solving',
        description: 'HackerRank coding assessment followed by technical discussion on algorithmic trade-offs.',
        duration: '60 mins',
      },
      {
        round: 'Round 2',
        title: 'Technical Architecture & Spring/Node Deep Dive',
        description: 'Microservice resilience, event streams via Kafka, and database consistency patterns.',
        duration: '60 mins',
      },
      {
        round: 'Round 3',
        title: 'AWS Cloud & DevOps Assessment',
        description: 'Container orchestration, CI/CD pipelines, automated testing, and zero-downtime blue/green deploys.',
        duration: '45 mins',
      },
      {
        round: 'Round 4',
        title: 'Leadership & STAR Behavioral',
        description: 'Ownership, driving innovation under legacy constraints, and cross-timezone communication.',
        duration: '45 mins',
      },
    ],
    keyQuestionThemes: [
      'Design high-availability order processing engine that guarantees idempotency',
      'How does Kafka consumer group rebalancing work and how do you prevent lag spikes?',
      'Explain database partitioning strategies for high-frequency order line items',
    ],
  },
  {
    id: 'lseg',
    name: 'LSEG (London Stock Exchange Group)',
    shortName: 'LSEG',
    category: 'srilanka',
    logoIcon: 'trending-up-outline',
    logoColor: '#00C853',
    logoBg: 'rgba(0, 200, 83, 0.14)',
    matchScore: 88,
    badge: 'CAPITAL MARKETS',
    badgeColor: '#00C853',
    title: 'LSEG Capital Markets Prep',
    subtitle: 'Ultra-low latency financial systems, MillenniumIT matching engine heritage, and C++/Java.',
    statsText: '150 SCENARIOS • World Trade Center Colombo',
    techStacks: ['C++20', 'Java 21', 'Low-Latency Messaging', 'Kafka', 'Linux Kernel Tuning', 'PostgreSQL', 'Rust'],
    headquarters: 'London, United Kingdom (Major Engineering Center in Colombo)',
    overview:
      'LSEG operates global financial market infrastructure. The Colombo center continues the world-renowned MillenniumIT legacy of building sub-millisecond stock trading engines.',
    interviewRounds: [
      {
        round: 'Round 1',
        title: 'Low-Latency Fundamentals & Data Structures',
        description: 'Cache locality, memory barriers, lock-free queues, and CPU instruction cache efficiency.',
        duration: '60 mins',
      },
      {
        round: 'Round 2',
        title: 'C++ / Core Java Deep Dive',
        description: 'Garbage collection tuning, zero-copy socket buffers, and multi-threaded synchronization.',
        duration: '60 mins',
      },
      {
        round: 'Round 3',
        title: 'Financial Systems & Order Book Design',
        description: 'Limit order book matching engine design, FIX protocol messaging, and audit logging.',
        duration: '60 mins',
      },
      {
        round: 'Round 4',
        title: 'Senior Engineering Leadership',
        description: 'Mission-critical mindset, zero tolerance for financial data corruption, and regulatory compliance.',
        duration: '45 mins',
      },
    ],
    keyQuestionThemes: [
      'Design a limit order book (LOB) matching engine with O(1) price-time priority',
      'How do you avoid JVM GC pauses in latency-sensitive financial applications?',
      'Explain lock-free single-producer single-consumer ring buffer implementation',
    ],
  },
  {
    id: '99x',
    name: '99x',
    shortName: '99x',
    category: 'srilanka',
    logoIcon: 'rocket-outline',
    logoColor: '#00F5D4',
    logoBg: 'rgba(0, 245, 212, 0.14)',
    matchScore: 93,
    badge: 'SCANDINAVIAN SAAS',
    badgeColor: '#00F5D4',
    title: '99x Product Engineering Prep',
    subtitle: 'European SaaS product development, high-performance web apps & Agile product leadership.',
    statsText: '95 SCENARIOS • Colombo & Norway',
    techStacks: ['React', 'TypeScript', 'Node.js', 'AWS Serverless', 'GraphQL', 'Next.js', 'PostgreSQL'],
    headquarters: 'Oslo, Norway & Colombo, Sri Lanka',
    overview:
      '99x specializes in co-creating high-performance digital products and SaaS platforms for European markets, operating with flat hierarchy and agile Scandinavian values.',
    interviewRounds: [
      {
        round: 'Round 1',
        title: 'JavaScript / TypeScript & Frontend Deep Dive',
        description: 'DOM performance, React rendering optimization, TypeScript generics, and state management.',
        duration: '45 mins',
      },
      {
        round: 'Round 2',
        title: 'Live Pair Programming / Code Review',
        description: 'Refactoring an existing component, unit testing, and architectural discussions.',
        duration: '60 mins',
      },
      {
        round: 'Round 3',
        title: 'Cloud Native & Serverless Design',
        description: 'AWS Lambda, EventBridge, DynamoDB single-table design, and CI/CD pipelines.',
        duration: '60 mins',
      },
      {
        round: 'Round 4',
        title: 'Agile Culture & Customer Empathy',
        description: 'Communicating with European product owners, product mindset, and autonomous delivery.',
        duration: '45 mins',
      },
    ],
    keyQuestionThemes: [
      'Explain React 19 server components vs client components with performance trade-offs',
      'Design a multi-tenant serverless SaaS architecture using AWS Lambda and DynamoDB',
      'How do you resolve conflicting product requirements when speaking directly with overseas clients?',
    ],
  },
  {
    id: 'virtusa',
    name: 'Virtusa',
    shortName: 'Virtusa',
    category: 'srilanka',
    logoIcon: 'business-outline',
    logoColor: '#FF4081',
    logoBg: 'rgba(255, 64, 129, 0.14)',
    matchScore: 89,
    badge: 'FINTECH & BANKING',
    badgeColor: '#FF4081',
    title: 'Virtusa Digital Transformation Prep',
    subtitle: 'Fintech engineering, cloud migration, and enterprise SDLC modernization.',
    statsText: '110 SCENARIOS • Dematagoda Colombo',
    techStacks: ['Java', 'Spring Cloud', 'Angular', 'React', 'AWS', 'Kafka', 'PostgreSQL', 'Oracle'],
    headquarters: 'Southborough, Massachusetts (Major Delivery Center in Colombo)',
    overview:
      'Virtusa drives digital business transformation for global Fortune 500 banks, healthcare networks, and telecom giants, with extensive engineering facilities in Colombo.',
    interviewRounds: [
      {
        round: 'Round 1',
        title: 'Core Java / Full Stack Competency',
        description: 'Object-oriented principles, collections framework, REST APIs, and SQL queries.',
        duration: '45 mins',
      },
      {
        round: 'Round 2',
        title: 'Microservices & Enterprise Patterns',
        description: 'Spring Boot, dependency injection, JPA/Hibernate performance, and distributed transactions (Saga).',
        duration: '60 mins',
      },
      {
        round: 'Round 3',
        title: 'Cloud & Database Optimization',
        description: 'AWS ECS/EKS container deployments, API security, and database indexing.',
        duration: '45 mins',
      },
      {
        round: 'Round 4',
        title: 'Client Readiness & Behavioral',
        description: 'Client delivery deadlines, working under structured enterprise processes, and teamwork.',
        duration: '45 mins',
      },
    ],
    keyQuestionThemes: [
      'How do you handle distributed transactions across microservices using the Saga pattern?',
      'Explain Spring security filter chain and JWT stateless authentication',
      'Optimize a sluggish JPA query that suffers from N+1 select problem',
    ],
  },
  {
    id: 'adl',
    name: 'Axiata Digital Labs',
    shortName: 'ADL',
    category: 'srilanka',
    logoIcon: 'hardware-chip-outline',
    logoColor: '#00E676',
    logoBg: 'rgba(0, 230, 118, 0.14)',
    matchScore: 91,
    badge: 'TELCO-TECH CLOUD',
    badgeColor: '#00E676',
    title: 'Axiata Digital Labs Prep',
    subtitle: 'Telco cloud platforms, high-concurrency microservices, and Axonect digital suite.',
    statsText: '105 SCENARIOS • Colombo & Malaysia',
    techStacks: ['Java', 'Kubernetes', 'Go', 'Spring Boot', 'MongoDB', 'Redis', 'Docker', 'Kafka'],
    headquarters: 'Kuala Lumpur, Malaysia & Colombo, Sri Lanka',
    overview:
      'ADL is the technology hub of the Axiata Group, building bleeding-edge telco-grade platforms, digital billing engines, and enterprise 5G IoT microservices.',
    interviewRounds: [
      {
        round: 'Round 1',
        title: 'Technical Fundamentals & Problem Solving',
        description: 'Core programming logic, algorithm complexity, and API protocols.',
        duration: '45 mins',
      },
      {
        round: 'Round 2',
        title: 'High-Concurrency & Microservice Architecture',
        description: 'Handling millions of mobile subscriber transactions with Redis caching and Kafka.',
        duration: '60 mins',
      },
      {
        round: 'Round 3',
        title: 'Kubernetes & Telco Cloud Orchestration',
        description: 'Container scaling, ingress routing, API rate-limiting, and distributed tracing.',
        duration: '60 mins',
      },
      {
        round: 'Round 4',
        title: 'Leadership & Cross-Border Collaboration',
        description: 'Delivering across Asian telecommunications markets and cross-cultural agility.',
        duration: '45 mins',
      },
    ],
    keyQuestionThemes: [
      'Design a real-time mobile prepaid balance deduction service with sub-50ms latency',
      'How do you manage distributed cache invalidation across multiple Kubernetes clusters with Redis?',
    ],
  },
];

// -------------------------------------------------------------
// JOB OPENINGS NOWADAYS (MOCK DATA FOR NOW - READY FOR REAL DATA)
// -------------------------------------------------------------
export const JOB_OPENINGS: JobOpening[] = [
  {
    id: 'job-1',
    companyId: 'wso2',
    companyName: 'WSO2',
    region: 'srilanka',
    title: 'Senior Software Engineer - Cloud Platforms & Ballerina',
    location: 'Colombo, Sri Lanka (Hybrid / Remote Option)',
    workplaceType: 'Hybrid',
    experienceLevel: '3 - 6 Years',
    salaryRange: 'LKR 550,000 - 850,000 / mo + Stock Options',
    postedDate: 'Active • 2 days ago',
    badge: 'URGENT HIRING',
    department: 'Choreo Cloud Engineering',
    techStacks: ['Go', 'Java', 'Ballerina', 'Kubernetes', 'Docker', 'Envoy', 'gRPC'],
    description:
      'We are looking for a Senior Software Engineer to build scalable microservices and developer tooling for Choreo, our next-generation Internal Developer Platform.',
    responsibilities: [
      'Design, implement, and maintain high-throughput cloud services powering developer automation and deployment pipelines.',
      'Contribute to open-source Ballerina language runtime, connectors, and standard libraries.',
      'Architect robust multi-tenant Kubernetes controller loops and Envoy gateway integrations.',
      'Mentor associate engineers and participate in architectural design reviews.',
    ],
    requirements: [
      'Strong proficiency in Go, Java, or C++ with a solid grasp of concurrency patterns.',
      'Hands-on experience with Docker, Kubernetes, and cloud infrastructure (AWS/GCP/Azure).',
      'Deep understanding of microservices, REST, gRPC, and asynchronous event streams.',
      'BSc or MSc in Computer Science, Software Engineering, or equivalent practical experience.',
    ],
    interviewStages: [
      'Recruiter Alignment (15m)',
      'Technical Screening & Live Coding (60m)',
      'System Architecture & Kubernetes Deep Dive (60m)',
      'Director Culture Alignment (45m)',
    ],
  },
  {
    id: 'job-2',
    companyId: 'ifs',
    companyName: 'IFS Sri Lanka',
    region: 'srilanka',
    title: 'Lead Full Stack Engineer - IFS Cloud Core Platform',
    location: 'Colombo 09, Sri Lanka (Hybrid)',
    workplaceType: 'Hybrid',
    experienceLevel: '5 - 8 Years',
    salaryRange: 'LKR 650,000 - 950,000 / mo + Global Travel Perks',
    postedDate: 'Active • 3 days ago',
    badge: 'GLOBAL IMPACT',
    department: 'Enterprise Application Foundation',
    techStacks: ['C#', '.NET 8', 'React', 'TypeScript', 'Azure', 'Oracle Database', 'Microservices'],
    description:
      'Join our Colombo Global R&D center to lead engineering teams developing the next major release of IFS Cloud, utilized by premier aerospace, asset, and service enterprises.',
    responsibilities: [
      'Lead full-stack architectural design for enterprise data grids, complex business logic, and modular microservices.',
      'Champion code quality, automated testing (Jest, xUnit), and CI/CD pipelines on Azure DevOps.',
      'Collaborate directly with product owners in Sweden and the UK on roadmap feasibility.',
      'Optimize relational query performance and memory footprints for massive global datasets.',
    ],
    requirements: [
      'Extensive background in C# / .NET Core and modern React / TypeScript development.',
      'Strong grasp of enterprise software architecture, multi-tenancy, and distributed caching.',
      'Solid experience with relational databases (Oracle, PostgreSQL, or SQL Server) and index tuning.',
      'Demonstrated technical leadership and ability to coach mid-level engineers.',
    ],
    interviewStages: [
      'Initial HR Screen (20m)',
      'Technical Code & Design Discussion (60m)',
      'Enterprise Scalability & DB Optimization (60m)',
      'Engineering Manager & Culture (45m)',
    ],
  },
  {
    id: 'job-3',
    companyId: 'syscolabs',
    companyName: 'Sysco LABS',
    region: 'srilanka',
    title: 'Senior DevOps / Platform Infrastructure Engineer',
    location: 'Colombo 03, Sri Lanka',
    workplaceType: 'Hybrid',
    experienceLevel: '4 - 7 Years',
    salaryRange: 'LKR 600,000 - 900,000 / mo + Medical & Wellness',
    postedDate: 'Active • 1 day ago',
    badge: 'HOT ROLE',
    department: 'Core Infrastructure & Platform Ops',
    techStacks: ['AWS', 'Terraform', 'Kubernetes', 'Python', 'Datadog', 'GitLab CI', 'Kafka'],
    description:
      'Drive high-availability cloud infrastructure and automated deployment pipelines supporting millions of foodservice orders daily across North America and Europe.',
    responsibilities: [
      'Provision, monitor, and scale production multi-account AWS environments with Terraform Infrastructure-as-Code.',
      'Administer enterprise Kubernetes (EKS) clusters, service meshes, and observability stacks (Datadog/Prometheus).',
      'Collaborate with software development squads to maintain 99.99% system uptime.',
      'Lead incident response, automated failovers, and disaster recovery tabletop drills.',
    ],
    requirements: [
      'Proven track record managing production workloads on AWS (EKS, RDS, SQS, CloudFront).',
      'Deep expertise in Terraform, Linux system administration, and shell/Python scripting.',
      'Hands-on experience with CI/CD automation and container security hardening.',
      'AWS Certified Solutions Architect or DevOps Engineer certification is an advantage.',
    ],
    interviewStages: [
      'Technical Recruiter Intro (20m)',
      'DevOps Technical Screen (Live troubleshooting) (60m)',
      'Cloud Architecture & Security Panel (60m)',
      'Executive Leadership Interview (45m)',
    ],
  },
  {
    id: 'job-4',
    companyId: 'lseg',
    companyName: 'LSEG (London Stock Exchange Group)',
    region: 'srilanka',
    title: 'Senior Java / C++ Low-Latency Financial Engineer',
    location: 'World Trade Center, Colombo (Hybrid)',
    workplaceType: 'Hybrid',
    experienceLevel: '4 - 8 Years',
    salaryRange: 'Industry Leading + Annual Bonus + Financial Stock Plan',
    postedDate: 'Active • 4 days ago',
    badge: 'FINANCIAL MARKETS',
    department: 'Capital Markets Technology',
    techStacks: ['Java 21', 'C++20', 'Low-Latency Messaging', 'Kafka', 'Linux Kernel', 'Spring Boot'],
    description:
      'Develop and fine-tune mission-critical exchange matching engines and market data distribution services handling billions of transactions per second with sub-millisecond precision.',
    responsibilities: [
      'Write ultra-optimized, lock-free C++ and Java code with zero-allocation memory discipline.',
      'Design and benchmark multi-threaded order book algorithms and high-speed network protocols.',
      'Investigate CPU cache misses, branch mispredictions, and kernel bypass networking.',
      'Ensure strict regulatory compliance, auditability, and deterministic replayability of trades.',
    ],
    requirements: [
      'Exceptional proficiency in C++20 or Modern Java with deep memory model understanding.',
      'Knowledge of multi-threading, asynchronous I/O, IPC mechanisms, and Linux socket programming.',
      'Experience in financial protocols (FIX, ITCH, OUCH) or real-time gaming engines is a major plus.',
      'Rigorous mindset for mathematical correctness and reliability.',
    ],
    interviewStages: [
      'Online Coding Challenge (75m)',
      'Low-Latency Fundamentals & Data Structures (60m)',
      'Financial System Architecture Deep Dive (60m)',
      'Senior Engineering Director Loop (45m)',
    ],
  },
  {
    id: 'job-5',
    companyId: '99x',
    companyName: '99x',
    region: 'srilanka',
    title: 'Associate Tech Lead - React & Node.js Cloud Solutions',
    location: 'Colombo, Sri Lanka (Flexible Remote)',
    workplaceType: 'Remote',
    experienceLevel: '5 - 8 Years',
    salaryRange: 'Pegged to Euro/USD equivalent • Performance Bonuses',
    postedDate: 'Active • 5 hours ago',
    badge: 'REMOTE FRIENDLY',
    department: 'European SaaS Practice',
    techStacks: ['React', 'TypeScript', 'Node.js', 'Next.js', 'AWS Serverless', 'PostgreSQL', 'GraphQL'],
    description:
      'Lead an autonomous product engineering squad building innovative SaaS solutions directly with European product founders and technology leaders.',
    responsibilities: [
      'Architect modern web applications using React, Next.js, and serverless Node.js backend services.',
      'Engage directly with Scandinavian clients to translate strategic goals into technical deliverables.',
      'Guide team sprint cadence, technical spikes, and code review standards.',
      'Drive automated test coverage and zero-configuration CI/CD pipelines.',
    ],
    requirements: [
      'Deep mastery of TypeScript, modern React patterns, and serverless architectures (AWS Lambda/DynamoDB).',
      'Strong communication skills with experience interacting directly with foreign clients.',
      'Passionate about clean code, software craftsmanship, and agile principles.',
    ],
    interviewStages: [
      'Culture & Technical Fit Screen (30m)',
      'Live Coding & Architecture Session (60m)',
      'Client Interaction & Scenario Loop (45m)',
      'Final Management Chat (30m)',
    ],
  },
  {
    id: 'job-6',
    companyId: 'google',
    companyName: 'Google',
    region: 'global',
    title: 'Software Engineer III - Distributed Systems & Cloud Infrastructure',
    location: 'Singapore / Zurich / Remote Eligible',
    workplaceType: 'Hybrid',
    experienceLevel: '3 - 6 Years (L4/L5)',
    salaryRange: '$165,000 - $215,000 USD / yr + RSUs + Bonus',
    postedDate: 'Active • 2 days ago',
    badge: 'GLOBAL GIANTS',
    department: 'Google Cloud Platform (GCP)',
    techStacks: ['Go', 'C++', 'Java', 'Distributed Systems', 'Kubernetes', 'Borg', 'Bigtable'],
    description:
      'Build core distributed infrastructure powering Google Cloud services used by millions of developers and enterprise organizations worldwide.',
    responsibilities: [
      'Write scalable, maintainable Go/C++ services handling billions of daily queries.',
      'Design consensus protocols, replication algorithms, and self-healing cluster services.',
      'Optimize latency bottlenecks across global data centers.',
      'Participate in on-call rotations and design post-mortem retrospectives.',
    ],
    requirements: [
      'BS, MS, or PhD in Computer Science or related technical discipline.',
      '3+ years of experience in distributed systems, network programming, or operating systems.',
      'Fluency in data structures, algorithmic complexity, and scalable design.',
    ],
    interviewStages: [
      'Recruiter Screen (30m)',
      'Technical Phone Interview (45m)',
      'Virtual Onsite: 3x DSA Coding + 1x System Design + 1x Googleyness',
    ],
  },
  {
    id: 'job-7',
    companyId: 'amazon',
    companyName: 'Amazon',
    region: 'global',
    title: 'Software Development Engineer II (SDE-II) - AWS Core Services',
    location: 'Seattle, WA / Dublin, Ireland / Remote',
    workplaceType: 'Hybrid',
    experienceLevel: '3 - 6 Years',
    salaryRange: '$160,000 - $210,000 USD / yr + Sign-on + RSUs',
    postedDate: 'Active • 3 days ago',
    badge: 'AWS CLOUD',
    department: 'AWS Compute & Storage Platform',
    techStacks: ['Java', 'Python', 'AWS', 'DynamoDB', 'Microservices', 'Distributed Systems'],
    description:
      'Own mission-critical cloud primitives powering AWS. You will build highly available distributed systems that scale effortlessly to accommodate explosive cloud compute growth.',
    responsibilities: [
      'Architect, develop, and operate high-scale microservices with five-nines availability (99.999%).',
      'Actively apply Amazon Leadership Principles to daily product and architectural decisions.',
      'Review system design proposals and mentor associate engineers.',
    ],
    requirements: [
      'Bachelor’s degree in Computer Science or equivalent.',
      '3+ years professional software development experience in Java, C++, or Go.',
      'Strong problem-solving, algorithmic thinking, and system design skills.',
    ],
    interviewStages: [
      'Online Assessment (OA) (90m)',
      'Virtual Onsite Loop: 4 rounds (Coding, System Design, LP Bar Raiser)',
    ],
  },
];
