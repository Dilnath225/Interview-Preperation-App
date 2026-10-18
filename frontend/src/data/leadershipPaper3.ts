import { LeadershipQuestion } from './leadershipTypes';

export const paper3Questions: LeadershipQuestion[] = [
  {
    id: 1,
    category: 'Stakeholder Negotiation',
    scenario: 'A VP of Sales demands a customized enterprise feature delivered in 2 weeks for a big client demo. Your team’s estimate is 6 weeks. How do you negotiate?',
    options: [
      { id: 'A', text: 'Say yes to avoid conflict, then burn out your engineers with mandatory weekend shifts.' },
      { id: 'B', text: 'Say a blunt "No, impossible" and walk out of the room.' },
      { id: 'C', text: 'Present trade-off options: deliver a hardcoded interactive clickable demo or MVP slice for the demo in 2 weeks, with full production readiness scheduled in 6 weeks.' },
      { id: 'D', text: 'Promise it will be done and blame the developers when it fails.' }
    ],
    correctOption: 'C',
    explanation: 'Senior engineers negotiate scope and fidelity rather than dates alone, satisfying business demo needs without wrecking production stability.'
  },
  {
    id: 2,
    category: 'Disagree and Commit',
    scenario: 'You advocated for GraphQL, but after technical review, the architecture committee voted 4-1 for RESTful APIs with gRPC. What is your role now?',
    options: [
      { id: 'A', text: 'Passive-aggressively sabotage the gRPC implementation to prove your point.' },
      { id: 'B', text: 'Fully commit to the decision: help write excellent REST/gRPC schemas, build client tooling, and ensure the team succeeds.' },
      { id: 'C', text: 'Continue arguing about GraphQL in every standup for the next 6 months.' },
      { id: 'D', text: 'Secretly deploy GraphQL behind a reverse proxy.' }
    ],
    correctOption: 'B',
    explanation: 'High-performing teams debate vigorously upfront, but once a decision is made, everyone commits 100% to ensure collective success.'
  },
  {
    id: 3,
    category: 'Teammate Burnout',
    scenario: 'You notice a senior engineer on your team working past midnight every night, answering Slack messages at 3 AM, and becoming short-tempered. What do you do?',
    options: [
      { id: 'A', text: 'Ignore it because their high output makes the sprint velocity look great.' },
      { id: 'B', text: 'Have an empathetic 1-on-1 coffee chat, express genuine care, help them delegate tasks, and encourage taking time off before severe burnout.' },
      { id: 'C', text: 'Give them more tasks since they work so fast.' },
      { id: 'D', text: 'Criticize their attitude in the sprint review.' }
    ],
    correctOption: 'B',
    explanation: 'Sustainable pace prevents hero-syndrome burnout and turnover. Peers who look out for colleagues’ well-being strengthen team resilience.'
  },
  {
    id: 4,
    category: 'Technical Debt Negotiation',
    scenario: 'The Product Manager wants 100% new feature development for the next 3 quarters, leaving zero capacity for core refactoring. How do you advocate for tech health?',
    options: [
      { id: 'A', text: 'Secretly hide refactoring inside feature PRs and lie about estimates.' },
      { id: 'B', text: 'Use telemetry and metrics: show how defect rates and release cycle times are doubling, and propose a standard 80/20 capacity split (20% reserved for tech debt).' },
      { id: 'C', text: 'Refuse to work on new features.' },
      { id: 'D', text: 'Send an angry email to the CEO.' }
    ],
    correctOption: 'B',
    explanation: 'Framing technical debt in business terms (slower velocity, higher defect cost) and proposing a standard 20% budget wins product leadership support.'
  },
  {
    id: 5,
    category: 'Cross-Functional Conflict',
    scenario: 'The design team complains that engineering is cutting corners on animations and spacing. Engineers complain design is adding needless micro-interactions. How do you bridge the gap?',
    options: [
      { id: 'A', text: 'Tell design that aesthetics don’t matter as long as code compiles.' },
      { id: 'B', text: 'Establish a unified Design System (Figma tokens mapped to UI components) and hold a joint weekly pairing session between a designer and an engineer.' },
      { id: 'C', text: 'Cut off all communication between designers and developers.' },
      { id: 'D', text: 'Let the product manager decide every single pixel.' }
    ],
    correctOption: 'B',
    explanation: 'Building shared artifacts (Design System tokens) and direct collaboration channels dissolves friction between engineering and design.'
  },
  {
    id: 6,
    category: 'Handling Low Performance',
    scenario: 'A mid-level developer on your squad has missed sprint deliverables for three consecutive sprints. What is your role as a peer leader?',
    options: [
      { id: 'A', text: 'Gossip with other engineers that they should be fired.' },
      { id: 'B', text: 'Offer a supportive private 1-on-1: explore blockers (personal or technical), break down their next tasks into clearer milestones, and establish check-ins.' },
      { id: 'C', text: 'Complain publicly in the retrospective.' },
      { id: 'D', text: 'Quietly do their work for them every time.' }
    ],
    correctOption: 'B',
    explanation: 'Constructive peer coaching diagnoses root causes early, offering structured support before formal HR performance escalation.'
  },
  {
    id: 7,
    category: 'Architectural Governance',
    scenario: 'Two senior engineers are locked in a 3-week debate over whether to use Event Sourcing or Traditional CRUD. The project is stalled. How do you facilitate a decision?',
    options: [
      { id: 'A', text: 'Let them fight until one gives up.' },
      { id: 'B', text: 'Define evaluation criteria (team skill curve, operational overhead, scale requirements, audit needs), score both options, and timebox a spike prototype.' },
      { id: 'C', text: 'Flip a coin in front of them.' },
      { id: 'D', text: 'Cancel the project.' }
    ],
    correctOption: 'B',
    explanation: 'Structured decision matrices with timeboxed technical spikes break analysis paralysis through empirical data.'
  },
  {
    id: 8,
    category: 'Managing Up',
    scenario: 'Your engineering manager promises a delivery date to executive leadership without consulting the engineering squad. The date is unrealistic. How do you address it?',
    options: [
      { id: 'A', text: 'Publicly humiliate your manager in front of executives.' },
      { id: 'B', text: 'Have a private 1-on-1 with your manager: walk through the data-driven work breakdown structure, highlight critical path risks, and help them draft an executive revision.' },
      { id: 'C', text: 'Quit on the spot.' },
      { id: 'D', text: 'Say nothing and let the launch fail catastrophically.' }
    ],
    correctOption: 'B',
    explanation: 'Effective senior engineers protect their manager’s credibility while providing the objective technical data needed to correct course.'
  },
  {
    id: 9,
    category: 'Crisis Communication',
    scenario: 'A payment gateway webhook goes down, double-charging 400 customers. Customer support is overwhelmed. What is your immediate engineering communication priority?',
    options: [
      { id: 'A', text: 'Go into a private room, turn off Slack, and code silently.' },
      { id: 'B', text: 'Designate a communications incident commander, post status updates every 15 minutes to support/executives, apply the fix, and trigger automated refund batch jobs.' },
      { id: 'C', text: 'Post on LinkedIn apologizing.' },
      { id: 'D', text: 'Blame the payment gateway on Twitter.' }
    ],
    correctOption: 'B',
    explanation: 'Clear, predictable incident cadences calm stakeholders and free up technical responders to execute remediation safely.'
  },
  {
    id: 10,
    category: 'Culture & Psychological Safety',
    scenario: 'A junior engineer makes an embarrassing mistake during a sprint demo in front of directors. A peer giggles and makes a mocking comment. How do you react?',
    options: [
      { id: 'A', text: 'Join in the laughter so you don’t look uncool.' },
      { id: 'B', text: 'Step in warmly: "Live demos are tough! That happens to all of us—the underlying architecture you built is fantastic." Speak to the mocking peer privately later.' },
      { id: 'C', text: 'Scream at the peer in front of the directors.' },
      { id: 'D', text: 'Ignore it completely.' }
    ],
    correctOption: 'B',
    explanation: 'Senior leaders protect psychological safety by neutralizing ridicule publicly and addressing unprofessional conduct privately.'
  },
  {
    id: 11,
    category: 'Hiring & Bar Raising',
    scenario: 'You are interviewing a candidate who has brilliant coding skills but displays arrogance, interrupts you repeatedly, and belittles their former colleagues. What is your hiring verdict?',
    options: [
      { id: 'A', text: '"Strong Hire" because 10x coding talent outweighs toxic behavioral traits.' },
      { id: 'B', text: '"Do Not Hire" because cultural toxicity and inability to collaborate destroy more team output than any individual contributor creates.' },
      { id: 'C', text: 'Hire them and assign them to work in total isolation forever.' },
      { id: 'D', text: 'Let them decide their own salary.' }
    ],
    correctOption: 'B',
    explanation: 'Protecting team culture and humility is paramount. Brilliant jerks degrade team psychological safety and drive away top talent.'
  },
  {
    id: 12,
    category: 'Strategic Trade-offs',
    scenario: 'Building a custom in-house auth system will take 4 months of team effort. Integrating an enterprise provider (Auth0/Clerk) costs $200/month and takes 3 days. What is your recommendation?',
    options: [
      { id: 'A', text: 'Build custom auth because real engineers never buy third-party tools.' },
      { id: 'B', text: 'Recommend the enterprise managed service to save 4 months of engineering salary and focus team innovation on unique business value.' },
      { id: 'C', text: 'Do not use authentication at all.' },
      { id: 'D', text: 'Spend 2 years building your own database.' }
    ],
    correctOption: 'B',
    explanation: '"Build vs Buy" analysis: Offloading non-differentiating undifferentiated heavy lifting (like auth/billing) frees engineers to build core competitive advantage.'
  },
  {
    id: 13,
    category: 'Mentoring Mid-Levels',
    scenario: 'A mid-level developer wants to get promoted to senior. They ask you what they need to demonstrate. What do you tell them?',
    options: [
      { id: 'A', text: '"Just write more lines of code and commit on weekends."' },
      { id: 'B', text: '"Seniority is about scope: driving ambiguity to clarity, multiplying peers through code reviews and mentorship, and owning system-level reliability."' },
      { id: 'C', text: '"Kiss up to the VP of Engineering."' },
      { id: 'D', text: '"Memorize LeetCode hard problems."' }
    ],
    correctOption: 'B',
    explanation: 'Senior engineers are judged by their blast radius: technical leadership, elevating others, system ownership, and cross-functional alignment.'
  },
  {
    id: 14,
    category: 'Technical Roadmapping',
    scenario: 'Your microservices architecture has grown to 45 services with inconsistent logging and tracing. How do you lead an observability modernization initiative?',
    options: [
      { id: 'A', text: 'Write a 100-page document and force everyone to stop coding for 2 months.' },
      { id: 'B', text: 'Draft an RFC for OpenTelemetry standards, create a reusable shared middleware library, pilot it on 2 core services, and roll it out iteratively.' },
      { id: 'C', text: 'Delete half the microservices.' },
      { id: 'D', text: 'Wait until production crashes and leadership forces it.' }
    ],
    correctOption: 'B',
    explanation: 'Engineering roadmaps succeed through modular abstractions, proof-of-concept pilots, and paved-road tooling rather than top-down mandates.'
  },
  {
    id: 15,
    category: 'Vendor Negotiation',
    scenario: 'A cloud analytics vendor increases prices by 300% upon contract renewal. How do you approach the engineering response?',
    options: [
      { id: 'A', text: 'Panic and write an angry tweet tagging their CEO.' },
      { id: 'B', text: 'Audit actual feature utilization, evaluate open-source self-hosted alternatives, calculate migration costs, and leverage alternatives in pricing talks.' },
      { id: 'C', text: 'Immediately accept the price increase without checking alternatives.' },
      { id: 'D', text: 'Turn off all company analytics forever.' }
    ],
    correctOption: 'B',
    explanation: 'Technical leaders pair cost architecture analysis with migration feasibility to support commercial negotiations effectively.'
  },
  {
    id: 16,
    category: 'Handling Toxic Behavior',
    scenario: 'A contractor regularly writes condescending comments on pull requests submitted by junior developers. What is your action?',
    options: [
      { id: 'A', text: 'Ignore it because they are a temporary contractor.' },
      { id: 'B', text: 'Address it immediately: quote the code of conduct, have a firm private conversation about review tone, and escalate to the manager if it continues.' },
      { id: 'C', text: 'Insult the contractor back publicly.' },
      { id: 'D', text: 'Tell junior engineers to get thicker skin.' }
    ],
    correctOption: 'B',
    explanation: 'Zero tolerance for derogatory behavior preserves psychological safety and protects junior talent from being demoralized.'
  },
  {
    id: 17,
    category: 'Technical Pragmatism',
    scenario: 'The team wants to adopt a brand new bleeding-edge database released last month on HackerNews for our primary customer billing database. How do you evaluate?',
    options: [
      { id: 'A', text: 'Adopt it immediately because newer tools are always superior.' },
      { id: 'B', text: 'Exercise technological conservatism on mission-critical state: stick to proven, mature databases (Boring Technology) with decades of disaster-recovery hardening.' },
      { id: 'C', text: 'Ban all new technologies in the company.' },
      { id: 'D', text: 'Store customer billing in text files.' }
    ],
    correctOption: 'B',
    explanation: '"Choose Boring Technology": Critical core systems require proven durability, backup tooling, and deep operational debugging knowledge.'
  },
  {
    id: 18,
    category: 'Engineering Standards',
    scenario: 'A squad rushes code to production by bypassing pull requests and skipping staging tests. They claim "speed is all that matters." How do you intervene?',
    options: [
      { id: 'A', text: 'Start doing the same thing yourself.' },
      { id: 'B', text: 'Show team metrics: deployments that bypass automated guardrails generate 4x more production emergency rollbacks, ultimately destroying speed.' },
      { id: 'C', text: 'Revoke their GitHub accounts secretly.' },
      { id: 'D', text: 'Give up on engineering standards.' }
    ],
    correctOption: 'B',
    explanation: 'Quality is not the enemy of speed—it is the prerequisite. Data showing rollback costs proves that automated guardrails accelerate sustainable velocity.'
  },
  {
    id: 19,
    category: 'Delegation',
    scenario: 'You are the most experienced engineer on the squad. A high-visibility architectural design document needs to be written. Should you write it yourself?',
    options: [
      { id: 'A', text: 'Always write it yourself so you get all the visibility.' },
      { id: 'B', text: 'Pair with or assign it to a promising mid-level engineer, acting as an advisor/reviewer so they grow their architectural and leadership muscles.' },
      { id: 'C', text: 'Assign it to an intern with zero guidance.' },
      { id: 'D', text: 'Refuse to write design docs.' }
    ],
    correctOption: 'B',
    explanation: 'Great leaders create more leaders by delegating stretch opportunities with supportive safety nets.'
  },
  {
    id: 20,
    category: 'Continuous Delivery Philosophy',
    scenario: 'A release manager wants to batch 3 months of features into one giant "Big Bang" release on New Year’s Eve. What is your recommendation?',
    options: [
      { id: 'A', text: 'Agree and prepare to spend New Year’s Eve fixing production outages.' },
      { id: 'B', text: 'Advocate strongly for small, decoupled, daily/weekly releases behind feature flags to isolate blast radius and allow instant targeted rollbacks.' },
      { id: 'C', text: 'Quit the day before release.' },
      { id: 'D', text: 'Never release any new code.' }
    ],
    correctOption: 'B',
    explanation: 'Batch size reduction is the fundamental law of continuous delivery: small releases have exponentially lower failure rates.'
  },
  {
    id: 21,
    category: 'Stakeholder Alignment',
    scenario: 'The Security Officer demands two-factor authentication (2FA) enforced on all users immediately. Product worries it will increase user onboarding drop-off by 15%. How do you balance?',
    options: [
      { id: 'A', text: 'Side with Product and ignore Security completely.' },
      { id: 'B', text: 'Design a phased risk-based approach: enforce 2FA immediately for high-risk actions (withdrawals, password changes) and offer smooth progressive onboarding for new users.' },
      { id: 'C', text: 'Side with Security and disable user registration.' },
      { id: 'D', text: 'Let both departments battle it out.' }
    ],
    correctOption: 'B',
    explanation: 'Adaptive, risk-based security balances friction with protection, satisfying compliance while preserving customer conversion.'
  },
  {
    id: 22,
    category: 'System Scalability',
    scenario: 'Your system is projected to receive 10x traffic during Black Friday. What is the most effective leadership initiative 3 months prior?',
    options: [
      { id: 'A', text: 'Hope that AWS auto-scaling handles everything automatically.' },
      { id: 'B', text: 'Conduct end-to-end load and chaos tests (GameDay), identify database bottlenecks, configure rate limiting and circuit breakers, and establish freeze windows.' },
      { id: 'C', text: 'Disable the website during Black Friday.' },
      { id: 'D', text: 'Manually buy 100 servers on the morning of Black Friday.' }
    ],
    correctOption: 'B',
    explanation: 'Proactive load testing, circuit breakers, and game days surface real bottlenecks months before customer traffic hits.'
  },
  {
    id: 23,
    category: 'Managing Disillusionment',
    scenario: 'A talented developer on your squad feels disappointed because their feature didn’t achieve the expected business metrics. How do you coach them?',
    options: [
      { id: 'A', text: '"You failed, that feature was a waste of time."' },
      { id: 'B', text: '"The engineering execution was flawless. Product hypotheses fail all the time—learning what users don’t want is just as valuable as knowing what they do want."' },
      { id: 'C', text: 'Tell them to hide the metrics from management.' },
      { id: 'D', text: 'Blame the marketing team.' }
    ],
    correctOption: 'B',
    explanation: 'Reframing failed experiments as valuable business learnings protects developer morale and encourages iterative innovation.'
  },
  {
    id: 24,
    category: 'Technical Strategy',
    scenario: 'Your mobile app team wants to maintain two separate native codebases (Swift & Kotlin) while your team has only 3 engineers total. What do you evaluate?',
    options: [
      { id: 'A', text: 'Insist on native because cross-platform is uncool.' },
      { id: 'B', text: 'Present the business reality: a 3-engineer team cannot sustainably maintain two native apps and backend services. Evaluate React Native/Flutter for unified velocity.' },
      { id: 'C', text: 'Work 100 hours a week.' },
      { id: 'D', text: 'Drop mobile support completely.' }
    ],
    correctOption: 'B',
    explanation: 'Pragmatic technical leadership aligns technological choices with team size and operational runway.'
  },
  {
    id: 25,
    category: 'Feedback Delivery',
    scenario: 'You need to give critical feedback to a senior peer about their aggressive communication during sprint planning. When and where do you do it?',
    options: [
      { id: 'A', text: 'In the middle of the planning meeting in front of everyone.' },
      { id: 'B', text: 'In a private, dedicated 1-on-1 soon after the meeting, using non-judgmental observation ("When you interrupted X, it discouraged discussion").' },
      { id: 'C', text: 'Send an anonymous Slack message.' },
      { id: 'D', text: 'Post a passive-aggressive meme on LinkedIn.' }
    ],
    correctOption: 'B',
    explanation: 'Timely, private feedback focusing on specific behaviors rather than personal attacks creates the best opportunity for behavioral change.'
  },
  {
    id: 26,
    category: 'Incident Post-Mortems',
    scenario: 'A post-mortem identifies that a developer missed an edge case in a manual checklist. What is the true senior engineering takeaway?',
    options: [
      { id: 'A', text: 'Add 20 more manual checklists and tell developers to read slower.' },
      { id: 'B', text: 'Recognize that human checklists fail; automate the verification into CI pipelines or static analysis so the mistake is technically impossible to repeat.' },
      { id: 'C', text: 'Publicly reprimand the developer.' },
      { id: 'D', text: 'Ban that developer from deploying.' }
    ],
    correctOption: 'B',
    explanation: 'Poka-Yoke (mistake-proofing): Senior leaders build automated guardrails into CI rather than relying on human willpower.'
  },
  {
    id: 27,
    category: 'Mentoring vs Micro-Managing',
    scenario: 'You assigned an architecture task to a junior engineer. You find yourself checking their branch every 30 minutes and rewriting their commits. What should you do?',
    options: [
      { id: 'A', text: 'Continue doing it because perfection matters above all else.' },
      { id: 'B', text: 'Step back: agree on checkpoint milestones (e.g. daily 15-min sync), allow them space to make minor mistakes, and focus on coaching rather than takeover.' },
      { id: 'C', text: 'Delete their branch and do the whole task yourself.' },
      { id: 'D', text: 'Complain that nobody can code like you.' }
    ],
    correctOption: 'B',
    explanation: 'Overcoming micromanagement requires setting clear milestone expectations and tolerating the learning curve of growing engineers.'
  },
  {
    id: 28,
    category: 'Deprecating Systems',
    scenario: 'Your company has an old internal microservice that only 2 internal tools use, but it costs $3,000/month to run. How do you drive deprecation?',
    options: [
      { id: 'A', text: 'Turn it off on Monday morning without warning to see who screams.' },
      { id: 'B', text: 'Publish a clear deprecation timeline (e.g. 60 days), reach out to the 2 consuming teams, assist in their migration, and celebrate the final decommissioning.' },
      { id: 'C', text: 'Leave it running forever.' },
      { id: 'D', text: 'Rebrand the microservice as "legacy" and ignore it.' }
    ],
    correctOption: 'B',
    explanation: 'Graceful deprecation pairs advance notice and migration assistance with firm sunset deadlines to reclaim organizational resources.'
  },
  {
    id: 29,
    category: 'Ethical Engineering',
    scenario: 'A product executive asks you to build a dark pattern that tricks users into subscribing to recurring billing without a clear opt-out. What do you do?',
    options: [
      { id: 'A', text: 'Build it without question.' },
      { id: 'B', text: 'Push back on ethical and legal grounds: explain compliance regulations (FTC/GDPR), potential brand damage, and propose a transparent subscription model.' },
      { id: 'C', text: 'Leak company code to the press immediately.' },
      { id: 'D', text: 'Silently write the code with intentional memory leaks.' }
    ],
    correctOption: 'B',
    explanation: 'Engineers have an ethical responsibility to protect users from deceptive dark patterns and shield the company from regulatory disaster.'
  },
  {
    id: 30,
    category: 'Engineering Culture',
    scenario: 'Your team has grown from 4 to 20 engineers and onboarding takes 4 weeks of hand-holding. What strategic initiative should you champion?',
    options: [
      { id: 'A', text: 'Stop hiring new engineers.' },
      { id: 'B', text: 'Create an automated "Day One" onboarding repo (Dockerized dev containers, seed data scripts, self-guided tour) reducing time-to-first-PR to 48 hours.' },
      { id: 'C', text: 'Assign 1 senior engineer to be a full-time babysitter.' },
      { id: 'D', text: 'Tell new hires to figure it out themselves.' }
    ],
    correctOption: 'B',
    explanation: 'Paved-road developer environments and self-service seed data transform onboarding efficiency at scale.'
  },
  {
    id: 31,
    category: 'Stakeholder Expectation Management',
    scenario: 'A feature launch date is set for Q3, but 3 team members leave the company in the same month. What is your communication to executives?',
    options: [
      { id: 'A', text: 'Say nothing and pretend team velocity hasn’t changed.' },
      { id: 'B', text: 'Proactively communicate the revised team capacity with data: recalculate realistic sprint velocity, present de-scoped trade-offs, and outline hiring timelines.' },
      { id: 'C', text: 'Promise that remaining engineers will work 80 hours a week.' },
      { id: 'D', text: 'Send an email saying the company is doomed.' }
    ],
    correctOption: 'B',
    explanation: 'Leadership values early, realistic, data-driven forecasts over false optimism that collapses on release day.'
  },
  {
    id: 32,
    category: 'API Versioning & Breaking Changes',
    scenario: 'You need to refactor a public API response schema that 50 mobile clients and external partners rely on. How do you implement it?',
    options: [
      { id: 'A', text: 'Deploy the breaking change directly to `/v1/` on production.' },
      { id: 'B', text: 'Introduce a `/v2/` endpoint or header versioning, keep `/v1/` backward-compatible, announce a deprecation window, and monitor telemetry on `/v1/` calls.' },
      { id: 'C', text: 'Delete the endpoint.' },
      { id: 'D', text: 'Tell mobile users to update their apps immediately.' }
    ],
    correctOption: 'B',
    explanation: 'Semantic versioning and backward compatibility protect external clients from catastrophic breakage.'
  },
  {
    id: 33,
    category: 'Continuous Testing Culture',
    scenario: 'The QA team has a 4-day manual regression backlog that delays every release. How can engineering help solve this bottlenecks?',
    options: [
      { id: 'A', text: 'Blame the QA team for being too slow.' },
      { id: 'B', text: 'Pair with QA to build end-to-end automated smoke tests in Playwright/Cypress integrated into CI, reducing manual testing to exploratory checks.' },
      { id: 'C', text: 'Abolish testing.' },
      { id: 'D', text: 'Hire 20 more manual testers.' }
    ],
    correctOption: 'B',
    explanation: 'Shifting testing left and empowering QA through automated E2E suites eliminates delivery pipeline bottlenecks.'
  },
  {
    id: 34,
    category: 'Managing Unrealistic Tech Hype',
    scenario: 'A non-technical executive reads an article on quantum blockchain AI and demands your team integrate it into your internal inventory app. How do you reply?',
    options: [
      { id: 'A', text: 'Agree enthusiastically and spend the annual budget on it.' },
      { id: 'B', text: 'Respectfully acknowledge the article, re-center on the core business problem (inventory accuracy), and explain why proven relational tech delivers 10x ROI.' },
      { id: 'C', text: 'Laugh in their face and tell them they are clueless.' },
      { id: 'D', text: 'Quit.' }
    ],
    correctOption: 'B',
    explanation: 'Patiently steering hype back to business outcomes protects capital and preserves executive alignment.'
  },
  {
    id: 35,
    category: 'Knowledge Silos',
    scenario: 'Only one senior engineer knows how the legacy payment billing cron job works. If they are on vacation, nobody can touch it. How do you address this risk?',
    options: [
      { id: 'A', text: 'Never allow that engineer to take vacations.' },
      { id: 'B', text: 'Prioritize a "Bus Factor" reduction sprint: pair that engineer with two peers, record walkthroughs, document architecture diagrams, and test failovers.' },
      { id: 'C', text: 'Ignore it and pray nothing breaks.' },
      { id: 'D', text: 'Fire the engineer so everyone has to learn it.' }
    ],
    correctOption: 'B',
    explanation: 'Eliminating single points of failure (improving the team’s bus factor) is an essential senior leadership responsibility.'
  },
  {
    id: 36,
    category: 'Inclusive Team Building',
    scenario: 'You are planning a team bonding social event. Several team members do not drink alcohol or have caretaking duties in the evening. What do you plan?',
    options: [
      { id: 'A', text: 'A late-night pub crawl and call anyone who doesn’t attend anti-social.' },
      { id: 'B', text: 'An inclusive daytime event during working hours (e.g. catered team lunch, escape room, or board game afternoon) where everyone can participate.' },
      { id: 'C', text: 'Cancel all social events.' },
      { id: 'D', text: 'Hold the event on Sunday morning.' }
    ],
    correctOption: 'B',
    explanation: 'Inclusive team activities occur during work hours and respect diverse personal backgrounds and lifestyle commitments.'
  },
  {
    id: 37,
    category: 'Feature Decommissioning',
    scenario: 'A feature built 2 years ago has 3 active users but generates 40% of customer support edge-case tickets and technical debt. How do you advocate for removal?',
    options: [
      { id: 'A', text: 'Delete it secretly.' },
      { id: 'B', text: 'Present the data: support costs vs revenue. Contact the 3 users, offer alternatives or customized migration, and sunset the feature cleanly.' },
      { id: 'C', text: 'Leave it forever.' },
      { id: 'D', text: 'Charge the 3 users $1,000,000.' }
    ],
    correctOption: 'B',
    explanation: 'Pruning low-value, high-maintenance features keeps the product lean, reliable, and cost-efficient.'
  },
  {
    id: 38,
    category: 'Advocacy for Diversity',
    scenario: 'You are on the interview hiring panel. The panel is rejecting a female candidate because she didn’t feel "like a culture fit." Her technical score was high. What do you say?',
    options: [
      { id: 'A', text: 'Agree quietly because you don’t want to rock the boat.' },
      { id: 'B', text: 'Challenge the vague feedback: "Culture fit is often an unconscious bias proxy for similarity. Let’s evaluate based on our objective rubric and culture add."' },
      { id: 'C', text: 'Accuse everyone on the panel of malice.' },
      { id: 'D', text: 'Walk out of the room.' }
    ],
    correctOption: 'B',
    explanation: 'Championing "culture add" over subjective "culture fit" actively mitigates unconscious bias and enriches team diversity.'
  },
  {
    id: 39,
    category: 'Incident Post-Mortem Action Items',
    scenario: 'A post-mortem meeting ends with 15 action items. Two months later, none of them have been started. How do you fix this systemic issue?',
    options: [
      { id: 'A', text: 'Stop doing post-mortems since action items are ignored.' },
      { id: 'B', text: 'Limit post-mortem action items to the top 2-3 highest-impact preventative tickets, assign explicit owners, and schedule them into the very next sprint.' },
      { id: 'C', text: 'Yell at the team in Slack.' },
      { id: 'D', text: 'Create 50 more tickets.' }
    ],
    correctOption: 'B',
    explanation: 'Fewer, highly prioritized, immediately scheduled action items guarantee real systemic hardening after outages.'
  },
  {
    id: 40,
    category: 'Visionary Leadership',
    scenario: 'What is the most fundamental difference between a brilliant individual programmer and a true engineering leader?',
    options: [
      { id: 'A', text: 'An engineering leader types 120 words per minute and never makes syntax errors.' },
      { id: 'B', text: 'An engineering leader focuses on multiplier impact: empowering teams, clarifying architecture, establishing psychological safety, and driving business value.' },
      { id: 'C', text: 'An engineering leader works 80 hours a week alone.' },
      { id: 'D', text: 'An engineering leader has the most GitHub stars.' }
    ],
    correctOption: 'B',
    explanation: 'True engineering leadership is measured not by individual heroic output, but by the elevated capability, velocity, and health of the entire team.'
  }
];
