import { LeadershipQuestion } from './leadershipTypes';

export const paper2Questions: LeadershipQuestion[] = [
  {
    id: 1,
    category: 'Code Review Leadership',
    scenario: 'A peer submits a pull request with 1,200 lines of code touching 18 files with minimal test coverage. What is your response as a reviewing engineer?',
    options: [
      { id: 'A', text: 'Approve it immediately without reading so you don’t hold up their sprint velocity.' },
      { id: 'B', text: 'Politely request breaking the PR into smaller, reviewable chunks (e.g. backend contract first, then UI) and adding unit tests.' },
      { id: 'C', text: 'Reject the PR rudely in public and complain to the Tech Lead.' },
      { id: 'D', text: 'Ignore the PR review request for two weeks.' }
    ],
    correctOption: 'B',
    explanation: 'Smaller PRs reduce review fatigue, uncover bugs faster, and maintain codebase quality without personal confrontation.'
  },
  {
    id: 2,
    category: 'Technical Debt',
    scenario: 'You notice that an existing database query has an N+1 problem that slows down user dashboards. The current sprint is full. How do you handle this?',
    options: [
      { id: 'A', text: 'Silently spend the whole week rewriting the query, ignoring your committed sprint stories.' },
      { id: 'B', text: 'Document the query latency metrics, create a prioritized tech debt ticket, and advocate for it in the next sprint planning.' },
      { id: 'C', text: 'Ignore it because it wasn’t your code originally.' },
      { id: 'D', text: 'Restart the database server whenever it slows down.' }
    ],
    correctOption: 'B',
    explanation: 'Quantifying technical debt with data and planning it into sprint backlogs aligns engineering health with product roadmaps.'
  },
  {
    id: 3,
    category: 'Managing Ambiguity',
    scenario: 'A Product Manager gives you a user story that says: "Make the search bar smarter." No wireframes or acceptance criteria are provided. What is your next move?',
    options: [
      { id: 'A', text: 'Start coding an AI vector search immediately without asking questions.' },
      { id: 'B', text: 'Schedule a 20-minute grooming session with the PM to define clear user personas, acceptance criteria, and edge cases.' },
      { id: 'C', text: 'Reject the ticket and tell the PM to do their job properly.' },
      { id: 'D', text: 'Wait until the sprint demo to show a plain text input.' }
    ],
    correctOption: 'B',
    explanation: 'Collaborative backlog refinement turns vague requirements into concrete engineering deliverables.'
  },
  {
    id: 4,
    category: 'Agile Commitments',
    scenario: 'Midway through a 2-week sprint, an unexpected complexity makes it clear you will only finish 3 out of your 4 committed stories. What should you do?',
    options: [
      { id: 'A', text: 'Work 18-hour days to deliver everything, even if the code is riddled with bugs and untested.' },
      { id: 'B', text: 'Immediately notify your Tech Lead and Scrum Master, explain the blocker, and re-scope/deprioritize the lowest impact story early.' },
      { id: 'C', text: 'Say nothing and let the story fail on the final day of the sprint.' },
      { id: 'D', text: 'Mark the unfinished ticket as "Done" and fix it in production later.' }
    ],
    correctOption: 'B',
    explanation: 'Early visibility into sprint risks allows the team to manage stakeholder expectations and adjust delivery without panic.'
  },
  {
    id: 5,
    category: 'Production Reliability',
    scenario: 'A feature you deployed to staging triggers a 500 error in an unrelated checkout flow. QA flags it. What is your response?',
    options: [
      { id: 'A', text: '"It worked on my machine, so it must be a staging infrastructure glitch."' },
      { id: 'B', text: 'Take immediate ownership, inspect staging logs, reproduce the issue, and push a hotfix or roll back before production release.' },
      { id: 'C', text: 'Blame the QA engineer for testing edge cases that don’t matter.' },
      { id: 'D', text: 'Merge it to production anyway and monitor Sentry.' }
    ],
    correctOption: 'B',
    explanation: 'Accountability for regression testing and swift remediation prevents staging defects from reaching customers.'
  },
  {
    id: 6,
    category: 'Cross-Team Dependencies',
    scenario: 'Your frontend feature depends on a backend endpoint being built by another team, but their sprint was delayed. What is the best engineering decision?',
    options: [
      { id: 'A', text: 'Stop working completely and take days off waiting for them.' },
      { id: 'B', text: 'Agree on an OpenAPI/JSON schema contract with the backend team and mock the API responses so frontend development continues unblocked.' },
      { id: 'C', text: 'Change the frontend requirements so you don’t need the backend.' },
      { id: 'D', text: 'Send an aggressive email to the backend engineering manager.' }
    ],
    correctOption: 'B',
    explanation: 'Contract-first development with mock adapters uncouples dependencies and enables parallel progress across squads.'
  },
  {
    id: 7,
    category: 'Incident Management',
    scenario: 'You are on-call. A sudden spike in error rates triggers a P1 alert at 10 PM. You suspect a recent deployment caused it. What do you do?',
    options: [
      { id: 'A', text: 'Mute the alert and go to sleep.' },
      { id: 'B', text: 'Acknowledge the incident in the on-call channel, roll back the recent deployment to restore customer availability, then investigate.' },
      { id: 'C', text: 'Start debugging live code on production servers without rollback.' },
      { id: 'D', text: 'Wait until 9 AM the next morning to check.' }
    ],
    correctOption: 'B',
    explanation: 'In incident response, restoring customer availability (Mean Time to Recovery - MTTR) via rollback takes precedence over live debugging.'
  },
  {
    id: 8,
    category: 'Refactoring vs Delivery',
    scenario: 'You are adding a new payment method. You see the entire checkout service could be rewritten cleanly with design patterns. Time is tight. How do you decide?',
    options: [
      { id: 'A', text: 'Rewrite the entire checkout architecture now, delaying the payment launch by two months.' },
      { id: 'B', text: 'Implement the payment method cleanly with clear modular boundaries, and document a phased refactoring proposal for future sprints.' },
      { id: 'C', text: 'Write messy code since the existing code is already messy.' },
      { id: 'D', text: 'Refuse to work on the ticket until management approves a full rewrite.' }
    ],
    correctOption: 'B',
    explanation: 'Balancing pragmatic feature delivery with incremental modular cleanup is the mark of a mature engineer.'
  },
  {
    id: 9,
    category: 'Conflict with Senior',
    scenario: 'A senior engineer insists on using MongoDB for a relational financial transaction ledger. You believe PostgreSQL is much safer. How do you argue your point?',
    options: [
      { id: 'A', text: 'Insult their technical credibility in public meetings.' },
      { id: 'B', text: 'Write a comparative RFC with data on ACID transaction guarantees, schema integrity, and rollback capabilities to discuss objectively.' },
      { id: 'C', text: 'Stay silent and let the project fail to prove them wrong.' },
      { id: 'D', text: 'Secretly configure PostgreSQL without telling them.' }
    ],
    correctOption: 'B',
    explanation: 'Technical disagreements should be resolved through objective trade-off analysis (RFCs) rather than emotional disputes.'
  },
  {
    id: 10,
    category: 'Mentoring Juniors',
    scenario: 'A junior engineer asks you the same question about Git rebase for the third time this week. How do you respond?',
    options: [
      { id: 'A', text: '"I already told you this twice, why can’t you remember anything?"' },
      { id: 'B', text: 'Walk through it patiently with them, encourage them to write down the cheat sheet, and add a Git workflow guide to the team repo.' },
      { id: 'C', text: 'Take their laptop and do it for them silently.' },
      { id: 'D', text: 'Tell them to stop asking you questions.' }
    ],
    correctOption: 'B',
    explanation: 'Empowering team members through documentation and patient reinforcement scales knowledge and builds team trust.'
  },
  {
    id: 11,
    category: 'Stakeholder Communication',
    scenario: 'The marketing lead asks you: "Can we add a quick banner to the homepage today?" It is not in your sprint. How do you handle it?',
    options: [
      { id: 'A', text: 'Say yes immediately and stay up all night to do it.' },
      { id: 'B', text: 'Say no rudely: "I don’t take orders from marketing."' },
      { id: 'C', text: 'Explain current sprint priorities, evaluate effort (e.g. 1 hour vs 1 day), and loop in the PM to prioritize trade-offs.' },
      { id: 'D', text: 'Deploy it directly to production without testing.' }
    ],
    correctOption: 'C',
    explanation: 'Protecting sprint focus while remaining empathetic and directing scope negotiations through product managers preserves predictability.'
  },
  {
    id: 12,
    category: 'Post-Mortem Culture',
    scenario: 'A bug you introduced caused an outage yesterday. In the blameless post-mortem meeting today, what is your mindset?',
    options: [
      { id: 'A', text: 'Defensive: blame the linter, the reviewer, and the staging environment.' },
      { id: 'B', text: 'Blameless & analytical: walk through the failure timeline, identify missing automated guardrails, and suggest preventive tests.' },
      { id: 'C', text: 'Resign from the company out of embarrassment.' },
      { id: 'D', text: 'Refuse to attend the meeting.' }
    ],
    correctOption: 'B',
    explanation: 'Blameless post-mortems focus on systemic improvements (CI checks, canary deployments) rather than individual blame.'
  },
  {
    id: 13,
    category: 'Security Leadership',
    scenario: 'A third-party npm package in your service has a critical remote code execution (RCE) CVE reported. What is the priority?',
    options: [
      { id: 'A', text: 'Leave it until next quarter’s maintenance window.' },
      { id: 'B', text: 'Treat it as an immediate P0/P1 vulnerability: test the upgrade patch, verify breaking changes, and deploy promptly.' },
      { id: 'C', text: 'Disable security scanning so the CI build doesn’t fail.' },
      { id: 'D', text: 'Post about it on Reddit.' }
    ],
    correctOption: 'B',
    explanation: 'Critical security CVEs require prompt triage and remediation to prevent unauthorized exploits.'
  },
  {
    id: 14,
    category: 'Continuous Delivery',
    scenario: 'Your team releases software once every 3 months with high manual regression testing pain. What is your suggestion?',
    options: [
      { id: 'A', text: 'Release once a year instead to minimize the pain.' },
      { id: 'B', text: 'Advocate for CI/CD automation, trunk-based development, and automated integration tests to move toward bi-weekly or daily releases.' },
      { id: 'C', text: 'Fire the QA team.' },
      { id: 'D', text: 'Stop testing altogether.' }
    ],
    correctOption: 'B',
    explanation: 'Modern DORA metrics prove that smaller, frequent, automated releases drastically lower deployment risk and lead time.'
  },
  {
    id: 15,
    category: 'Code Ownership',
    scenario: 'You are modifying an existing file and notice an outdated, unused helper function. What do you do?',
    options: [
      { id: 'A', text: 'Leave it forever because touching it might break something.' },
      { id: 'B', text: 'Verify references across the repository, delete the dead code, and verify tests pass (the Boy Scout Rule).' },
      { id: 'C', text: 'Comment it out with your initials.' },
      { id: 'D', text: 'Copy the dead code into three more files.' }
    ],
    correctOption: 'B',
    explanation: 'Actively removing dead code reduces cognitive overhead and prevents future maintenance confusion.'
  },
  {
    id: 16,
    category: 'Performance Optimization',
    scenario: 'A teammate wants to rewrite a working Python microservice in Rust because "Rust is faster," even though latency is currently 15ms. How do you advise?',
    options: [
      { id: 'A', text: 'Support the rewrite immediately because Rust is trendy.' },
      { id: 'B', text: 'Look at actual business SLAs: 15ms is well within requirements. Advise against premature optimization and focus on higher-impact business features.' },
      { id: 'C', text: 'Mock the teammate in Slack.' },
      { id: 'D', text: 'Suggest rewriting it in Assembly instead.' }
    ],
    correctOption: 'B',
    explanation: 'Premature optimization without profiling or business justification consumes valuable engineering capacity for negligible ROI.'
  },
  {
    id: 17,
    category: 'Documentation Stewardship',
    scenario: 'Your team adopts a new state management library in the frontend. Who should document the best practices?',
    options: [
      { id: 'A', text: 'Nobody, everyone should read the library’s external docs.' },
      { id: 'B', text: 'The engineer or squad who introduced the pattern should write an architectural decision record (ADR) and example usage guide.' },
      { id: 'C', text: 'The technical writer only.' },
      { id: 'D', text: 'The newest intern.' }
    ],
    correctOption: 'B',
    explanation: 'Whoever introduces a major architectural shift owns the initial documentation and standards dissemination.'
  },
  {
    id: 18,
    category: 'Estimations',
    scenario: 'During sprint poker, everyone votes 3 points for a ticket, but you realize an undocumented legacy third-party sync is involved that will take much longer. What do you do?',
    options: [
      { id: 'A', text: 'Change your vote to 3 to avoid disagreeing with the majority.' },
      { id: 'B', text: 'Voice your estimate (e.g. 8 points) and explain the hidden complexity so the team can re-estimate accurately.' },
      { id: 'C', text: 'Stay quiet and laugh when the assignee struggles.' },
      { id: 'D', text: 'Refuse to participate in estimation rituals.' }
    ],
    correctOption: 'B',
    explanation: 'Transparently highlighting hidden technical traps during estimation protects sprint commitments and team morale.'
  },
  {
    id: 19,
    category: 'Pairing Strategy',
    scenario: 'A junior engineer is stuck on a critical race condition bug for 2 days. What is the most effective way to help them?',
    options: [
      { id: 'A', text: 'Take the ticket away from them completely.' },
      { id: 'B', text: 'Pair with them for 45 minutes: have them explain the reproduction steps, observe logs together, and guide them to uncover the root cause.' },
      { id: 'C', text: 'Tell them to work over the weekend.' },
      { id: 'D', text: 'Send them a link to a 600-page book on concurrency.' }
    ],
    correctOption: 'B',
    explanation: 'Collaborative pairing provides guidance without stealing ownership, fostering long-term autonomy.'
  },
  {
    id: 20,
    category: 'Workplace Inclusion',
    scenario: 'In sprint planning, one quiet engineer rarely speaks up, but has great technical depth. How can you be an ally?',
    options: [
      { id: 'A', text: 'Ignore them since they chose not to speak.' },
      { id: 'B', text: 'In a gentle way, invite their thoughts: "Alex, you worked on this service last quarter—do you have any perspectives on this approach?"' },
      { id: 'C', text: 'Speak over them whenever they try to speak.' },
      { id: 'D', text: 'Tell the manager that Alex is lazy.' }
    ],
    correctOption: 'B',
    explanation: 'Inclusive leaders actively create space for quieter team members to share their expertise without putting undue pressure on them.'
  },
  {
    id: 21,
    category: 'Code Review Etiquette',
    scenario: 'You notice a PR where the author used loops instead of a map function. It is purely an aesthetic choice and has zero performance difference. What do you do?',
    options: [
      { id: 'A', text: 'Block the PR until they change it to your preferred syntax.' },
      { id: 'B', text: 'Leave it as a "Nit:" or optional suggestion, or approve without blocking, respecting author style within team conventions.' },
      { id: 'C', text: 'Accuse the author of being an amateur.' },
      { id: 'D', text: 'Reject the PR and close it.' }
    ],
    correctOption: 'B',
    explanation: 'Distinguishing between blocking bugs and non-blocking stylistic preferences ("Nit:") keeps review velocity healthy.'
  },
  {
    id: 22,
    category: 'Customer Advocacy',
    scenario: 'A customer reports a bug that only affects 0.1% of users, but causes them to lose data. The PM wants to mark it "Won’t Fix." How do you advocate?',
    options: [
      { id: 'A', text: 'Agree with the PM because 0.1% is negligible.' },
      { id: 'B', text: 'Highlight the severity: data loss destroys trust. Propose a targeted patch or safety safeguard to protect user data integrity.' },
      { id: 'C', text: 'Leak the conversation on Twitter.' },
      { id: 'D', text: 'Secretly fix it without logging a PR.' }
    ],
    correctOption: 'B',
    explanation: 'Data loss bugs represent severe brand and trust risks regardless of low user percentage; engineers must advocate for data integrity.'
  },
  {
    id: 23,
    category: 'Continuous Learning',
    scenario: 'Your company introduces a new cloud architecture (Kubernetes & Terraform). You have only worked with simple Docker containers. What is your approach?',
    options: [
      { id: 'A', text: 'Complain that the company is complicating things unnecessarily.' },
      { id: 'B', text: 'Embrace the learning opportunity: take company training, read the manifests, and volunteer to shadow a deployment.' },
      { id: 'C', text: 'Pretend you know everything and break the cluster.' },
      { id: 'D', text: 'Look for a new job immediately.' }
    ],
    correctOption: 'B',
    explanation: 'High adaptability and continuous upskilling are core traits of engineers who advance from junior to senior roles.'
  },
  {
    id: 24,
    category: 'Refactoring Strategy',
    scenario: 'You need to refactor a complex authentication service with no existing unit tests. What is the safest first step?',
    options: [
      { id: 'A', text: 'Rewrite the whole file from scratch and deploy on Friday afternoon.' },
      { id: 'B', text: 'Write characterization/integration tests around the existing behavior first to establish a safety net, then refactor incrementally.' },
      { id: 'C', text: 'Delete the tests and change the code.' },
      { id: 'D', text: 'Ask someone else to do it.' }
    ],
    correctOption: 'B',
    explanation: 'Establishing automated safety nets (golden master / characterization tests) before refactoring legacy code guarantees regression safety.'
  },
  {
    id: 25,
    category: 'Disagreement with Policy',
    scenario: 'The engineering leadership mandates that all repositories must maintain 80% test coverage. You feel 80% is arbitrary. What do you do?',
    options: [
      { id: 'A', text: 'Write fake assertions like `expect(true).toBe(true)` to cheat the metric.' },
      { id: 'B', text: 'Follow the policy in good faith by writing meaningful tests, and provide feedback in engineering forums with data on test quality vs coverage.' },
      { id: 'C', text: 'Refuse to write tests.' },
      { id: 'D', text: 'Disable coverage reporting on your repos.' }
    ],
    correctOption: 'B',
    explanation: 'Constructive compliance paired with data-driven leadership feedback maintains professionalism while advocating for nuance.'
  },
  {
    id: 26,
    category: 'Technical Communication',
    scenario: 'You need to explain a complex distributed caching invalidation bug to a non-technical Product Manager. How do you communicate?',
    options: [
      { id: 'A', text: 'Use heavy jargon: "The Redis LRU eviction TTL hash ring had a concurrency race condition."' },
      { id: 'B', text: 'Use an everyday analogy: "Our digital store display was showing old cached prices because the update memo hadn’t arrived yet."' },
      { id: 'C', text: 'Tell the PM: "You wouldn’t understand, just let me code."' },
      { id: 'D', text: 'Say everything is fine and don’t explain.' }
    ],
    correctOption: 'B',
    explanation: 'Translating deep technical problems into clear business analogies builds trust and bridges engineering-product alignment.'
  },
  {
    id: 27,
    category: 'Team Morale',
    scenario: 'After a hard-fought sprint where the team successfully shipped a major milestone, what should you do in the retrospective?',
    options: [
      { id: 'A', text: 'Complain about everything that went wrong without acknowledging the milestone.' },
      { id: 'B', text: 'Give shoutouts to peers who helped, celebrate the achievement, and then constructively discuss opportunities for refinement.' },
      { id: 'C', text: 'Take all the credit for the launch.' },
      { id: 'D', text: 'Skip the meeting.' }
    ],
    correctOption: 'B',
    explanation: 'Recognizing peers’ contributions and celebrating shared wins fuels team morale and builds collaborative goodwill.'
  },
  {
    id: 28,
    category: 'Feature Flags',
    scenario: 'You are deploying a large, risky new checkout feature. What release strategy provides the greatest safety?',
    options: [
      { id: 'A', text: 'Deploy to 100% of users immediately on a Friday.' },
      { id: 'B', text: 'Wrap the feature in a feature flag, roll out to 5% internal beta users, monitor metrics, then gradually ramp up to 100%.' },
      { id: 'C', text: 'Test it on production with your personal credit card and assume it’s fine.' },
      { id: 'D', text: 'Keep the code on a long-lived feature branch for 6 months.' }
    ],
    correctOption: 'B',
    explanation: 'Feature flagging and canary rollouts allow instant rollback without redeployment, drastically reducing blast radius.'
  },
  {
    id: 29,
    category: 'Mentorship Growth',
    scenario: 'You have been at the company for 1 year. An intern joins your team. How can you step up as a leader?',
    options: [
      { id: 'A', text: 'Avoid them so you don’t waste your coding time.' },
      { id: 'B', text: 'Volunteer to be their onboarding buddy, set up a warm welcome sync, and offer clear guidance during their initial PRs.' },
      { id: 'C', text: 'Give them all the boring manual tasks you don’t want to do.' },
      { id: 'D', text: 'Criticize their university background.' }
    ],
    correctOption: 'B',
    explanation: 'Volunteering as an onboarding buddy is one of the highest-leverage ways a junior engineer demonstrates transition to mid-level leadership.'
  },
  {
    id: 30,
    category: 'API Design Standards',
    scenario: 'Your team is building a new REST API endpoint. A teammate proposes returning 200 OK with `{ error: "Not found" }` inside the body. How do you advise?',
    options: [
      { id: 'A', text: 'Agree because 200 means the server didn’t crash.' },
      { id: 'B', text: 'Recommend standard HTTP status codes (e.g. 404 for Not Found, 400 for Bad Request) for consistent client error handling and caching.' },
      { id: 'C', text: 'Suggest returning 500 for everything.' },
      { id: 'D', text: 'Leave it alone.' }
    ],
    correctOption: 'B',
    explanation: 'Adhering to standard HTTP conventions ensures interoperability with client interceptors, monitoring alerts, and CDNs.'
  },
  {
    id: 31,
    category: 'Managing Interruptions',
    scenario: 'Customer support keeps directly pinging you on Slack every 20 minutes with ad-hoc questions, breaking your focus. How do you solve this sustainably?',
    options: [
      { id: 'A', text: 'Block the support team and ignore their tickets.' },
      { id: 'B', text: 'Work with your lead to establish an official on-call support rotation channel so inquiries are triaged without disrupting the whole team.' },
      { id: 'C', text: 'Complain in all-hands that support is annoying.' },
      { id: 'D', text: 'Work only at night to avoid messages.' }
    ],
    correctOption: 'B',
    explanation: 'Process improvements like dedicated on-call rotations protect team deep work while ensuring support gets timely help.'
  },
  {
    id: 32,
    category: 'Quality Mindset',
    scenario: 'A product manager asks: "Can we skip writing automated tests for this MVP feature to ship 2 days earlier?" What is your response?',
    options: [
      { id: 'A', text: '"Sure, we will never need tests for this."' },
      { id: 'B', text: '"We can focus on critical path happy-path and regression tests to ship safely, rather than 100% coverage, but shipping zero tests will slow us down later."' },
      { id: 'C', text: '"No, I refuse to write code without 100% coverage."' },
      { id: 'D', text: '"Tests are useless anyway."' }
    ],
    correctOption: 'B',
    explanation: 'Pragmatic risk management balances speed with baseline automated safety on core user paths.'
  },
  {
    id: 33,
    category: 'Root Cause Analysis',
    scenario: 'A database connection pool exhaustion happens. Restarting the backend pod fixes it immediately. What should you do next?',
    options: [
      { id: 'A', text: 'Celebrate that it’s fixed and move on.' },
      { id: 'B', text: 'Investigate the root cause: find the unclosed connections or long-running queries causing the leak, and add connection pool timeouts.' },
      { id: 'C', text: 'Write a cron job to restart the pod every hour.' },
      { id: 'D', text: 'Blame the cloud provider.' }
    ],
    correctOption: 'B',
    explanation: 'Treating the root cause rather than the symptom prevents recurring outages and reinforces system stability.'
  },
  {
    id: 34,
    category: 'Cost Awareness',
    scenario: 'While reviewing AWS CloudWatch logs, you notice an unused Elasticsearch cluster running on large instances costing $800/month. What do you do?',
    options: [
      { id: 'A', text: 'Ignore it because cloud costs are paid by finance.' },
      { id: 'B', text: 'Verify with devops and the team if the cluster is obsolete, take a snapshot, and decommission it to save company resources.' },
      { id: 'C', text: 'Immediately terminate it in production without asking anyone.' },
      { id: 'D', text: 'Double its size.' }
    ],
    correctOption: 'B',
    explanation: 'Engineers who show financial stewardship and proactive cloud cost hygiene are highly valued by leadership.'
  },
  {
    id: 35,
    category: 'Cross-Functional Empathy',
    scenario: 'A QA engineer finds 8 edge-case bugs in your feature on the day of release. You are frustrated. How should you view this?',
    options: [
      { id: 'A', text: 'View QA as the enemy who is trying to make you look bad.' },
      { id: 'B', text: 'View QA as a vital safety partner who saved you from a disastrous public customer outage, and collaborate on prioritizing fixes.' },
      { id: 'C', text: 'Demand that QA write the code fixes themselves.' },
      { id: 'D', text: 'Argue that customers will never click those buttons.' }
    ],
    correctOption: 'B',
    explanation: 'High-performing engineering cultures view QA as partners in quality defense, not adversaries.'
  },
  {
    id: 36,
    category: 'Legacy Code Respect',
    scenario: 'You inherit a 5-year-old monolith written in vanilla JavaScript without TypeScript. You are frustrated by the lack of types. What is the constructive attitude?',
    options: [
      { id: 'A', text: 'Constantly complain in meetings about the previous developers.' },
      { id: 'B', text: 'Acknowledge that this legacy code built the company’s revenue, and propose a progressive migration strategy (e.g. adding JSDoc or incremental TypeScript).' },
      { id: 'C', text: 'Delete the repository and quit.' },
      { id: 'D', text: 'Refuse to fix bugs in that repository.' }
    ],
    correctOption: 'B',
    explanation: 'Pragmatic engineers respect that legacy code pays the company bills and approach modernization incrementally.'
  },
  {
    id: 37,
    category: 'Sprint Retrospective Ownership',
    scenario: 'In the retrospective, everyone complains that meetings are taking too much time, but nobody offers a solution. What do you propose?',
    options: [
      { id: 'A', text: 'Propose an experiment: establish "No-Meeting Wednesdays" and move async updates to Slack/Jira for 2 sprints to evaluate impact.' },
      { id: 'B', text: 'Tell everyone to stop complaining.' },
      { id: 'C', text: 'Boycott all future company meetings.' },
      { id: 'D', text: 'Schedule a daily 1-hour meeting to discuss why meetings are bad.' }
    ],
    correctOption: 'A',
    explanation: 'Actionable, time-boxed experiments turn passive complaints into measurable organizational improvements.'
  },
  {
    id: 38,
    category: 'Resilience under Failure',
    scenario: 'Your feature deployment fails smoke tests in production and has to be rolled back. You feel embarrassed and disappointed. How do you recover?',
    options: [
      { id: 'A', text: 'Hide under your desk and avoid speaking to the team.' },
      { id: 'B', text: 'Analyze the gap between staging and production environments, add the missing test, share a short debrief, and re-release with confidence.' },
      { id: 'C', text: 'Blame the staging environment.' },
      { id: 'D', text: 'Vow never to deploy on production again.' }
    ],
    correctOption: 'B',
    explanation: 'Resilience is demonstrated by converting failures into automated safety nets and clear learning.'
  },
  {
    id: 39,
    category: 'Security Best Practices',
    scenario: 'A developer asks you to share your database production credentials over Slack so they can run a quick query. What do you do?',
    options: [
      { id: 'A', text: 'Send the password immediately in plain text.' },
      { id: 'B', text: 'Decline firmly: explain credential sharing violates security policies, and guide them through requesting proper read-only audit access via IAM.' },
      { id: 'C', text: 'Post the password in a public channel.' },
      { id: 'D', text: 'Ignore them completely.' }
    ],
    correctOption: 'B',
    explanation: 'Upholding security boundaries politely while providing the legitimate access pathway protects compliance and data safety.'
  },
  {
    id: 40,
    category: 'Engineering Craftsmanship',
    scenario: 'You are writing an open-source library for internal company teams. What defines true craftsmanship for this deliverable?',
    options: [
      { id: 'A', text: 'Writing clever, cryptic one-liners that show off your algorithmic skills.' },
      { id: 'B', text: 'Intuitive API design, comprehensive README with copy-paste examples, 95% test coverage, and automated semantic versioning.' },
      { id: 'C', text: 'Shipping without documentation so people have to ask you how it works.' },
      { id: 'D', text: 'Publishing it with no license.' }
    ],
    correctOption: 'B',
    explanation: 'True engineering craftsmanship prioritizes clarity, intuitive ergonomics, automated testing, and developer experience (DX).'
  }
];
