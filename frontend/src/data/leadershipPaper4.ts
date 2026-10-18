import { LeadershipQuestion } from './leadershipTypes';

export const paper4Questions: LeadershipQuestion[] = [
  {
    id: 1,
    category: 'Engineering Management',
    scenario: 'You are stepping into a Tech Lead role. A senior engineer on your team openly challenges your authority in group meetings. How do you approach this?',
    options: [
      { id: 'A', text: 'Publicly humiliate them in the next meeting to assert dominance.' },
      { id: 'B', text: 'Schedule a private 1-on-1: acknowledge their technical expertise, seek to understand their concerns, align on team goals, and establish clear collaborative norms.' },
      { id: 'C', text: 'Quietly reassign them to trivial bug fixes to sideline them.' },
      { id: 'D', text: 'Complain to the VP to have them transferred immediately.' }
    ],
    correctOption: 'B',
    explanation: 'Effective leaders address resistance through private, empathetic, and direct 1-on-1 conversations, leveraging deep expertise rather than reacting defensively.'
  },
  {
    id: 2,
    category: 'Architectural Decision Records (ADR)',
    scenario: 'Your organization has 5 squads making conflicting architectural decisions (e.g. 3 different message brokers). As a Tech Lead, how do you unify standards?',
    options: [
      { id: 'A', text: 'Issue an executive mandate that everyone must use Kafka starting tomorrow.' },
      { id: 'B', text: 'Form an Architecture Working Group with leads from all squads, create a lightweight RFC/ADR process, and establish consensus-driven tech standards.' },
      { id: 'C', text: 'Let every team do whatever they want forever.' },
      { id: 'D', text: 'Refuse to review their PRs.' }
    ],
    correctOption: 'B',
    explanation: 'Cross-squad architecture requires inclusive RFC mechanisms where stakeholders co-create standards, ensuring genuine adoption.'
  },
  {
    id: 3,
    category: 'Managing High-Performing Outliers',
    scenario: 'A brilliant engineer on your squad produces 3x more code than anyone else, but refuses to write documentation or mentor juniors, stating it slows them down. What do you do?',
    options: [
      { id: 'A', text: 'Praise them publicly and let them ignore team standards indefinitely.' },
      { id: 'B', text: 'Coach them in 1-on-1s: true senior impact is a multiplier, not an individual island. Show how their undocumented code creates operational fragility, and tie promotion criteria to mentorship.' },
      { id: 'C', text: 'Fire them immediately.' },
      { id: 'D', text: 'Assign another engineer to be their personal full-time documentation writer.' }
    ],
    correctOption: 'B',
    explanation: 'Sustainable engineering scales through shared knowledge. Channeling high-output individual contributors toward mentorship and documentation prevents operational single points of failure.'
  },
  {
    id: 4,
    category: 'Sprint Capacity & Velocity',
    scenario: 'Executive leadership pushes for a 20% increase in sprint velocity every quarter. The team is already working at full sustainable capacity. How do you respond?',
    options: [
      { id: 'A', text: 'Artificially inflate story points to make the graphs look like velocity increased 20%.' },
      { id: 'B', text: 'Educate leadership: velocity is a capacity planning metric, not a productivity target (Goodhart’s Law). Show how pushing past sustainable capacity spikes defects and tech debt.' },
      { id: 'C', text: 'Demand that the team work 60 hours a week.' },
      { id: 'D', text: 'Quit.' }
    ],
    correctOption: 'B',
    explanation: 'When a measure becomes a target, it ceases to be a good measure (Goodhart’s Law). Tech Leads protect sustainable engineering pace with data-driven leadership coaching.'
  },
  {
    id: 5,
    category: 'Managing Underperformance Empathetically',
    scenario: 'A developer has had personal life challenges affecting their output for 2 months. Sprint deliverables are slipping. How do you balance empathy with team delivery?',
    options: [
      { id: 'A', text: 'Immediately initiate a formal Performance Improvement Plan (PIP) without asking questions.' },
      { id: 'B', text: 'Have a compassionate conversation, connect them to company EAP/leave resources, temporarily adjust their workload transparently, and set clear, achievable mini-milestones.' },
      { id: 'C', text: 'Pretend nothing is wrong and let the rest of the team quietly absorb all their work indefinitely.' },
      { id: 'D', text: 'Announce their personal issues in standup.' }
    ],
    correctOption: 'B',
    explanation: 'Balancing human empathy with operational clarity builds lifelong loyalty while maintaining delivery predictability.'
  },
  {
    id: 6,
    category: 'Delegation Mastery',
    scenario: 'Your squad has to build a critical real-time notification engine. You could build it in 4 days yourself, or guide a mid-level engineer who will take 9 days. What do you do?',
    options: [
      { id: 'A', text: 'Build it yourself so you look good to executives.' },
      { id: 'B', text: 'Delegate the architecture and coding to the mid-level engineer, providing design review, milestone check-ins, and safety guardrails so they level up.' },
      { id: 'C', text: 'Throw it to an intern with no review.' },
      { id: 'D', text: 'Outsource it to a random agency.' }
    ],
    correctOption: 'B',
    explanation: 'The fundamental shift from Senior to Lead is trading short-term speed for long-term team capability expansion.'
  },
  {
    id: 7,
    category: 'Technical Debt Repayment',
    scenario: 'Your legacy monolith has test suites that take 2.5 hours to run on CI, stalling all 6 squads. How do you lead an initiative to fix this?',
    options: [
      { id: 'A', text: 'Disable CI tests completely to make builds instant.' },
      { id: 'B', text: 'Form a cross-functional taskforce: profile slow test suites, parallelize runners, mock external APIs, and set a hard SLA (e.g. under 10 minutes).' },
      { id: 'C', text: 'Tell developers to get used to the wait.' },
      { id: 'D', text: 'Only run CI once a month.' }
    ],
    correctOption: 'B',
    explanation: 'Developer velocity is capped by feedback loops. Investing in CI speed multiplies the daily throughput of all contributing engineers.'
  },
  {
    id: 8,
    category: 'Hiring Strategy',
    scenario: 'Your company is scaling from 10 to 50 engineers. What is your priority for building an engineering interview process?',
    options: [
      { id: 'A', text: 'Ask obscure brain teasers and dynamic programming LeetCode hard problems that have zero relevance to your daily codebase.' },
      { id: 'B', text: 'Build standardized, practical rubrics: practical code pair programming, system design relevant to your domain, and behavioral culture-add evaluations.' },
      { id: 'C', text: 'Hire only people from your personal university alumni network.' },
      { id: 'D', text: 'Skip interviews and hire anyone who applies.' }
    ],
    correctOption: 'B',
    explanation: 'Objective, domain-relevant rubrics with calibrated interview panels eliminate bias and predict on-the-job engineering excellence.'
  },
  {
    id: 9,
    category: 'Psychological Safety',
    scenario: 'After a bad deployment, a mid-level developer looks terrified to speak in the post-mortem. As Tech Lead, how do you open the meeting?',
    options: [
      { id: 'A', text: '"Who deployed this commit and why did you not check your work?"' },
      { id: 'B', text: '"We are here to examine system design, monitoring, and automated safety nets. We assume everyone made the best decisions with the info they had. No individuals will be blamed."' },
      { id: 'C', text: 'Demand that the developer apologize to the company.' },
      { id: 'D', text: 'Skip the meeting.' }
    ],
    correctOption: 'B',
    explanation: 'Setting a blameless tone explicitly at the outset of retrospectives encourages honest disclosure of root causes and prevents cover-ups.'
  },
  {
    id: 10,
    category: 'Cross-Squad API Contracts',
    scenario: 'Squad A and Squad B disagree on JSON schema payload formatting for a shared microservice. The deadline is approaching. How do you arbitrate?',
    options: [
      { id: 'A', text: 'Let them battle on Slack indefinitely.' },
      { id: 'B', text: 'Host a 30-minute joint design review, reference company API guidelines (e.g. camelCase, ISO dates), document the agreed contract in OpenAPI, and sign off.' },
      { id: 'C', text: 'Cancel the feature.' },
      { id: 'D', text: 'Create two completely duplicate services to please both teams.' }
    ],
    correctOption: 'B',
    explanation: 'Decisive, structured contract mediation anchored in documented organizational conventions resolves cross-squad stalemates.'
  },
  {
    id: 11,
    category: '1-on-1 Leadership',
    scenario: 'What is the primary purpose of a regular 1-on-1 meeting between a Tech Lead / Manager and an engineer?',
    options: [
      { id: 'A', text: 'A status report to interrogate them about JIRA ticket numbers.' },
      { id: 'B', text: 'A dedicated space for the engineer: career development, psychological check-in, unblocking systemic friction, and two-way feedback.' },
      { id: 'C', text: 'A social gossip session.' },
      { id: 'D', text: 'A meeting that should be canceled whenever the Lead is busy.' }
    ],
    correctOption: 'B',
    explanation: '1-on-1s belong to the direct report, focusing on long-term growth, career aspirations, and eliminating organizational blockers.'
  },
  {
    id: 12,
    category: 'Promoting Engineering Standards',
    scenario: 'Engineers on your team keep bypassing unit tests because "they take too long to write." How do you shift the culture?',
    options: [
      { id: 'A', text: 'Install a Git pre-commit hook that deletes their code if coverage is below 90%.' },
      { id: 'B', text: 'Conduct a Lunch & Learn demonstrating testing utilities, test factories, and TDD techniques, while sharing case studies of how tests caught regression outages.' },
      { id: 'C', text: 'Stop doing code reviews.' },
      { id: 'D', text: 'Write all the tests yourself on weekends.' }
    ],
    correctOption: 'B',
    explanation: 'Cultural shifts require making the right way the easy way: providing training, scaffolding, and illustrating tangible value.'
  },
  {
    id: 13,
    category: 'Managing Executive Pressure',
    scenario: 'The CEO messages you directly: "Can we skip security reviews for our fintech integration so we announce it at TechCrunch next week?" What is your response?',
    options: [
      { id: 'A', text: '"Yes absolutely CEO, whatever you say."' },
      { id: 'B', text: 'Articulate risk transparently: "Launching an unreviewed fintech flow risks severe compliance fines and user fund theft. We can announce a private beta or press release, but production traffic requires the security sign-off."' },
      { id: 'C', text: 'Call the CEO an idiot.' },
      { id: 'D', text: 'Silently shut down the servers.' }
    ],
    correctOption: 'B',
    explanation: 'Tech Leads must have the professional backbone to protect the enterprise from catastrophic legal and security exposure while proposing viable press alternatives.'
  },
  {
    id: 14,
    category: 'Technical Spikes',
    scenario: 'Your squad needs to choose between AWS SQS and RabbitMQ for a new event pipeline. How do you structure the evaluation?',
    options: [
      { id: 'A', text: 'Argue in circles for 3 weeks based on personal blog posts.' },
      { id: 'B', text: 'Allocate a timeboxed 2-day spike: define benchmark metrics (throughput, operational cost, dead-letter queue handling), test both, and document results.' },
      { id: 'C', text: 'Use both simultaneously in production.' },
      { id: 'D', text: 'Ask ChatGPT to pick one blindly.' }
    ],
    correctOption: 'B',
    explanation: 'Empirical timeboxed spikes provide factual data on throughput and operational ergonomics, cutting through theoretical debates.'
  },
  {
    id: 15,
    category: 'Mitigating Hero Culture',
    scenario: 'One engineer consistently rescues the company by writing emergency scripts at 2 AM, but never documents them, making them indispensable. How do you handle this?',
    options: [
      { id: 'A', text: 'Give them a massive bonus and crown them MVP of the year.' },
      { id: 'B', text: 'Recognize their dedication, but coach them that true heroism is building robust, automated systems so nobody has to wake up at 2 AM.' },
      { id: 'C', text: 'Ban them from the company Slack.' },
      { id: 'D', text: 'Let them manage all production systems alone.' }
    ],
    correctOption: 'B',
    explanation: 'Hero culture masks systemic architecture defects. Sustainable leadership rewards preventative engineering over recurring firefighting.'
  },
  {
    id: 16,
    category: 'Career Path Coaching',
    scenario: 'A strong senior engineer is undecided whether they should pursue the Management Track (EM) or the Individual Contributor Track (Staff/Principal). How do you advise them?',
    options: [
      { id: 'A', text: 'Tell them everyone must become a manager to make good money.' },
      { id: 'B', text: 'Clarify that both tracks have equal prestige and compensation. Explore their energy source: do they derive energy from people coaching/organizational design or deep system architecture/technical roadmaps?' },
      { id: 'C', text: 'Make the decision for them.' },
      { id: 'D', text: 'Tell them they aren’t good enough for either.' }
    ],
    correctOption: 'B',
    explanation: 'Modern tech organizations offer parallel tracks where Staff+ Engineers have equivalent influence and compensation to Engineering Managers.'
  },
  {
    id: 17,
    category: 'Engineering Autonomy',
    scenario: 'How much technical autonomy should you give to a team of experienced senior engineers?',
    options: [
      { id: 'A', text: 'Zero autonomy: review every single function and tell them how to code.' },
      { id: 'B', text: 'High autonomy with clear boundaries: define the "Why" and "What" (business goals, SLAs, security guardrails), and empower the team to own the "How".' },
      { id: 'C', text: 'Total abandonment: never attend standups and never check their progress.' },
      { id: 'D', text: 'Dictate exact variable names.' }
    ],
    correctOption: 'B',
    explanation: 'Intent-based leadership sets clear boundaries and strategic outcomes while unleashing autonomous technical problem-solving.'
  },
  {
    id: 18,
    category: 'Handling Redundancy & Reorgs',
    scenario: 'The company undergoes a restructuring and cancels a project your squad spent 4 months building. Morale is low. How do you lead your squad through this?',
    options: [
      { id: 'A', text: 'Join them in trashing the company leadership and encourage everyone to resign.' },
      { id: 'B', text: 'Validate their feelings, highlight the valuable technical skills and modular assets gained, provide transparent context on the strategic pivot, and re-energize them around the new mission.' },
      { id: 'C', text: 'Pretend the project never existed and forbid talking about it.' },
      { id: 'D', text: 'Lie that the project will restart tomorrow.' }
    ],
    correctOption: 'B',
    explanation: 'Empathetic leaders acknowledge emotional disappointment, celebrate the team’s growth, and channel energy into the new strategic direction.'
  },
  {
    id: 19,
    category: 'Security Governance',
    scenario: 'An audit reveals that developers have write-access to the production database from their local machines. What must you do as a Tech Lead?',
    options: [
      { id: 'A', text: 'Keep it because it is convenient for quick debugging.' },
      { id: 'B', text: 'Immediately implement Principle of Least Privilege: revoke direct access, establish an audited bastion with temporary role-based access (RBAC) and data masking.' },
      { id: 'C', text: 'Delete the audit log.' },
      { id: 'D', text: 'Blame the devops team.' }
    ],
    correctOption: 'B',
    explanation: 'Direct production database access is a severe compliance and security vulnerability. Zero Trust and audited access protect company data.'
  },
  {
    id: 20,
    category: 'Strategic Refactoring',
    scenario: 'Your monolithic codebase has grown too large for one squad. When should you consider decomposing into microservices?',
    options: [
      { id: 'A', text: 'Immediately on day 1 before having product-market fit.' },
      { id: 'B', text: 'Only when distinct organizational domain boundaries (bounded contexts) and deployment bottlenecks justify the distributed operational complexity.' },
      { id: 'C', text: 'Whenever a new engineer asks for it.' },
      { id: 'D', text: 'Never, all microservices are bad.' }
    ],
    correctOption: 'B',
    explanation: 'Conway’s Law: Microservices solve organizational team scaling bottlenecks at the cost of distributed operational complexity; they should never be premature.'
  },
  {
    id: 21,
    category: 'Facilitating Retrospectives',
    scenario: 'Your sprint retrospectives have become stale, with team members repeating "sprint was fine" and checking their phones. How do you revitalize it?',
    options: [
      { id: 'A', text: 'Cancel retrospectives permanently.' },
      { id: 'B', text: 'Change the format: use visual frameworks (Sailboat, Lean Coffee, Mad/Sad/Glad), bring real production metrics, and focus on one high-impact action item.' },
      { id: 'C', text: 'Force everyone to write an essay.' },
      { id: 'D', text: 'Yell at them for not participating.' }
    ],
    correctOption: 'B',
    explanation: 'Rotating interactive facilitation formats and tying retrospectives to concrete metrics re-engages team participation.'
  },
  {
    id: 22,
    category: 'Managing Remote Teams',
    scenario: 'You are leading an engineering team distributed across 4 continents and 6 time zones. How do you maintain high velocity and alignment?',
    options: [
      { id: 'A', text: 'Force everyone to stay awake for synchronous meetings at 11 PM.' },
      { id: 'B', text: 'Embrace an Async-First culture: detailed RFCs, recorded loom demos, clear acceptance criteria, and overlapping golden hours for pairing.' },
      { id: 'C', text: 'Require webcam monitoring software on their laptops.' },
      { id: 'D', text: 'Fire all international engineers.' }
    ],
    correctOption: 'B',
    explanation: 'Distributed teams thrive on asynchronous documentation, clear ownership, and respectful synchronization windows.'
  },
  {
    id: 23,
    category: 'Technical Diversity & Tooling',
    scenario: 'A developer wants to introduce Rust into an established Node.js/Go backend team. What is the Tech Lead’s evaluation framework?',
    options: [
      { id: 'A', text: 'Reject it instantly because you don’t personally know Rust.' },
      { id: 'B', text: 'Evaluate total lifecycle cost: hiring talent, on-call support burden, CI build times, and performance gains before approving a new polyglot language.' },
      { id: 'C', text: 'Adopt it immediately without telling anyone.' },
      { id: 'D', text: 'Mock the developer.' }
    ],
    correctOption: 'B',
    explanation: 'Adding languages expands the company’s maintenance and hiring surface area; it requires multi-year operational justification.'
  },
  {
    id: 24,
    category: 'Stakeholder Trust',
    scenario: 'The Product Director says: "Engineering is a black box. We never know what you are doing or when features will be ready." How do you build transparency?',
    options: [
      { id: 'A', text: 'Tell the Product Director that engineering is none of their business.' },
      { id: 'B', text: 'Implement visual roadmap visibility (Jira Epics / Linear milestones), bi-weekly demo showcases, and shared metrics on release cadences.' },
      { id: 'C', text: 'Send them a 10,000-line git commit log every Friday.' },
      { id: 'D', text: 'Complain to the CEO.' }
    ],
    correctOption: 'B',
    explanation: 'Transparency dissolves distrust. Visual roadmaps and live milestone demos build strong product-engineering partnerships.'
  },
  {
    id: 25,
    category: 'Engineering Ethics & Data Privacy',
    scenario: 'Marketing asks for an unhashed export of all user emails and phone numbers to upload to a third-party advertising tracking tool. What is your response?',
    options: [
      { id: 'A', text: 'Export the database CSV and email it to them.' },
      { id: 'B', text: 'Decline firmly: explain GDPR/CCPA privacy compliance regulations, suggest privacy-preserving hashed identifiers or official secure integrations.' },
      { id: 'C', text: 'Leak the list online.' },
      { id: 'D', text: 'Delete the database.' }
    ],
    correctOption: 'B',
    explanation: 'Protecting PII (Personally Identifiable Information) from unencrypted leakage is a legal, ethical, and reputational imperative.'
  },
  {
    id: 26,
    category: 'Technical Mentorship',
    scenario: 'A talented engineer expresses strong imposter syndrome, constantly downplaying their contributions. How do you mentor them?',
    options: [
      { id: 'A', text: 'Tell them they are being overly sensitive.' },
      { id: 'B', text: 'Help them create a "Brag Sheet" tracking tangible metrics, accomplishments, and peer praise; encourage them to lead an internal technical session.' },
      { id: 'C', text: 'Agree with them that they are an imposter.' },
      { id: 'D', text: 'Give their credit to someone else.' }
    ],
    correctOption: 'B',
    explanation: 'Concrete documentation of achievements and stretch public opportunities help engineers overcome cognitive distortions like imposter syndrome.'
  },
  {
    id: 27,
    category: 'Chaos Engineering',
    scenario: 'Why should an engineering lead advocate for Chaos Engineering (intentionally injecting latency or killing pods in staging)?',
    options: [
      { id: 'A', text: 'To frustrate developers and break their code.' },
      { id: 'B', text: 'To uncover latent cascading failures and test automated failover/circuit breakers before unexpected real-world customer outages happen.' },
      { id: 'C', text: 'Because Netflix does it, so it’s cool.' },
      { id: 'D', text: 'To make the cloud bill higher.' }
    ],
    correctOption: 'B',
    explanation: 'Proactive chaos experiments validate system resilience and reveal silent dependency assumptions before production failure.'
  },
  {
    id: 28,
    category: 'Feedback Receptivity',
    scenario: 'In an anonymous 360-degree review, your team rates your delegation skills poorly, stating you are a bottleneck. How do you respond?',
    options: [
      { id: 'A', text: 'Demand that HR reveal who wrote the anonymous reviews so you can retaliate.' },
      { id: 'B', text: 'Address it openly in the next team sync: thank the team for the candid feedback, identify specific approvals you can delegate, and ask for accountability.' },
      { id: 'C', text: 'Deny the feedback and become even more controlling.' },
      { id: 'D', text: 'Resign immediately.' }
    ],
    correctOption: 'B',
    explanation: 'Vulnerable, accountable leadership in response to feedback demonstrates emotional intelligence and sets a powerful cultural benchmark.'
  },
  {
    id: 29,
    category: 'System Performance Tuning',
    scenario: 'A microservice CPU spikes to 100% under high concurrency. Two developers suggest doubling the Kubernetes replica count immediately. How do you guide them?',
    options: [
      { id: 'A', text: 'Double the replicas forever and never look at the code.' },
      { id: 'B', text: 'Scale replicas temporarily to protect customer SLA, but immediately attach a CPU profiler to find whether algorithmic complexity or unindexed queries caused the spike.' },
      { id: 'C', text: 'Refuse to scale and let the service crash.' },
      { id: 'D', text: 'Shut down the microservice.' }
    ],
    correctOption: 'B',
    explanation: 'Short-term tactical scaling protects user experience while immediate profiling addresses the underlying root cause.'
  },
  {
    id: 30,
    category: 'Engineering On-Call Hygiene',
    scenario: 'Engineers on your team dread on-call duty because they get paged 15 times a night for non-actionable alerts. How do you fix this?',
    options: [
      { id: 'A', text: 'Tell them on-call suffering is part of being an engineer.' },
      { id: 'B', text: 'Audit alert history: tune thresholds, eliminate non-actionable alerts, convert transient noise into Jira tickets, and establish an SLA of max 1-2 actionable pages per shift.' },
      { id: 'C', text: 'Turn off all alerting forever.' },
      { id: 'D', text: 'Make interns do all on-call rotations.' }
    ],
    correctOption: 'B',
    explanation: 'Alert fatigue destroys engineer mental health and leads to ignored real emergencies. Aggressive alert tuning is essential leadership hygiene.'
  },
  {
    id: 31,
    category: 'Continuous Integration SLAs',
    scenario: 'What is the ideal target duration for an automated CI pull-request pipeline in a modern high-velocity engineering team?',
    options: [
      { id: 'A', text: '4 hours.' },
      { id: 'B', text: 'Under 10 minutes, allowing rapid iteration and immediate developer feedback.' },
      { id: 'C', text: '2 days.' },
      { id: 'D', text: 'CI is unnecessary.' }
    ],
    correctOption: 'B',
    explanation: 'Sub-10 minute CI runs keep developers in a flow state and eliminate long context-switching delays.'
  },
  {
    id: 32,
    category: 'Managing Scope Creep',
    scenario: 'During sprint development, a client asks for 4 "small tweaks" that were not in the original scope. What does the Tech Lead do?',
    options: [
      { id: 'A', text: 'Accept all of them quietly without telling the team.' },
      { id: 'B', text: 'Capture the requests, evaluate effort, consult with the PM, and either swap them for equivalent story points or schedule them in the next sprint.' },
      { id: 'C', text: 'Insult the client.' },
      { id: 'D', text: 'Drop all original sprint work.' }
    ],
    correctOption: 'B',
    explanation: 'Scope discipline protects team commitments and prevents unmeasured sprint bloat.'
  },
  {
    id: 33,
    category: 'Technical Standards Governance',
    scenario: 'A developer argues that writing unit tests for frontend UI components is a waste of time. What is your position as Tech Lead?',
    options: [
      { id: 'A', text: 'Agree and delete all frontend tests.' },
      { id: 'B', text: 'Clarify testing strategy: unit test complex business logic and hooks, integration test user interaction flows with React Testing Library, and use E2E for smoke tests.' },
      { id: 'C', text: 'Force 100% snapshot test coverage on every styled button.' },
      { id: 'D', text: 'Ban frontend developers from the team.' }
    ],
    correctOption: 'B',
    explanation: 'Adopting the Testing Trophy (focusing on integration tests that test behavior rather than implementation details) yields high confidence with low maintenance.'
  },
  {
    id: 34,
    category: 'Team Recognition',
    scenario: 'A quiet backend developer spent 3 weeks optimizing caching, saving the company $50,000 in database bills, but nobody noticed. What do you do?',
    options: [
      { id: 'A', text: 'Take credit for the savings in the executive meeting.' },
      { id: 'B', text: 'Showcase their work in the engineering all-hands, quantify the financial impact, and ensure it is documented for their performance review.' },
      { id: 'C', text: 'Say nothing because saving money is just doing their job.' },
      { id: 'D', text: 'Ask why they didn’t save $100,000.' }
    ],
    correctOption: 'B',
    explanation: 'Shining a spotlight on invisible infrastructure victories validates quiet excellence and motivates cost-conscious engineering.'
  },
  {
    id: 35,
    category: 'Fostering Innovation',
    scenario: 'Your engineers are so buried in sprint tickets that they have zero time to explore new tools or creative ideas. How do you foster innovation?',
    options: [
      { id: 'A', text: 'Tell them to innovate on their own time on weekends.' },
      { id: 'B', text: 'Institute a quarterly 2-day Hackathon or 10% "FedEx Day" (ship something creative in 24 hours) with executive demos and prizes.' },
      { id: 'C', text: 'Ban all creative experiments.' },
      { id: 'D', text: 'Fire engineers who don’t innovate during standup.' }
    ],
    correctOption: 'B',
    explanation: 'Dedicated, protected innovation time (like 10% time or hackathons) produces breakthrough company features and boosts retention.'
  },
  {
    id: 36,
    category: 'SRE & Error Budgets',
    scenario: 'Your team adopts SRE (Site Reliability Engineering) principles. The service has exhausted its quarterly Error Budget (99.9% uptime breached). What must happen?',
    options: [
      { id: 'A', text: 'Ignore the error budget and keep shipping risky new features.' },
      { id: 'B', text: 'Feature freeze: halt non-critical feature rollouts and dedicate engineering capacity exclusively to reliability, testing, and infrastructure resilience.' },
      { id: 'C', text: 'Lower the SLA to 90% so you are never in breach.' },
      { id: 'D', text: 'Fire the SRE lead.' }
    ],
    correctOption: 'B',
    explanation: 'Error budgets create a balanced feedback loop between speed and stability: when breached, engineering pivots to reliability.'
  },
  {
    id: 37,
    category: 'Promoting from Within',
    scenario: 'You need to designate a Sub-Lead for an upcoming critical project. You have an outspoken developer and a quiet, highly thorough developer. How do you evaluate?',
    options: [
      { id: 'A', text: 'Pick the outspoken one because they talk the loudest.' },
      { id: 'B', text: 'Evaluate based on demonstrated competencies: track record of follow-through, ability to synthesize complexity, peer trust, and clear written communication.' },
      { id: 'C', text: 'Pick whoever takes you out for drinks.' },
      { id: 'D', text: 'Flip a coin.' }
    ],
    correctOption: 'B',
    explanation: 'Merit-based leadership selection looks at execution reliability, emotional intelligence, and technical clarity rather than charisma.'
  },
  {
    id: 38,
    category: 'Cross-Department Communication',
    scenario: 'The Legal and Compliance department asks why the team cannot store credit card CVV codes in the database. How does the Tech Lead respond?',
    options: [
      { id: 'A', text: 'Say "We will do whatever we want."' },
      { id: 'B', text: 'Reassure them: "You are 100% correct. Storing CVVs violates PCI-DSS regulations. We use a certified tokenization gateway and never touch raw CVVs."' },
      { id: 'C', text: 'Lie that the database is encrypted so it’s fine.' },
      { id: 'D', text: 'Refuse to talk to Legal.' }
    ],
    correctOption: 'B',
    explanation: 'Collaborating proactively with compliance and demonstrating knowledge of PCI-DSS standards protects the company from catastrophic liabilities.'
  },
  {
    id: 39,
    category: 'Team Velocity vs Morale',
    scenario: 'Your squad just finished 3 consecutive crunch sprints with high overtime. The PM wants a 4th crunch sprint. What is your decision as Tech Lead?',
    options: [
      { id: 'A', text: 'Agree immediately to keep the PM happy.' },
      { id: 'B', text: 'Push back firmly: continuous crunch leads to severe burnout, resignation, and defect spikes. Mandate a cooldown sprint focused on tech debt and recovery.' },
      { id: 'C', text: 'Tell the engineers to drink more coffee.' },
      { id: 'D', text: 'Resign.' }
    ],
    correctOption: 'B',
    explanation: 'Tech Leads must defend their team from endless crunch. Sustainable engineering velocity is a marathon, not a sprint.'
  },
  {
    id: 40,
    category: 'Leadership Philosophy',
    scenario: 'What is the ultimate definition of success for an Engineering Tech Lead?',
    options: [
      { id: 'A', text: 'The team cannot function for a single day without your direct instructions.' },
      { id: 'B', text: 'You have built such a high-trust, capable, and well-architected team culture that the team continues to thrive, ship, and innovate smoothly even when you are on vacation.' },
      { id: 'C', text: 'You have your name on every file in Git blame.' },
      { id: 'D', text: 'You have the highest salary in the company.' }
    ],
    correctOption: 'B',
    explanation: 'The pinnacle of servant leadership is building autonomous capability, shared ownership, and resilient systems that thrive without dependency on a single individual.'
  }
];
