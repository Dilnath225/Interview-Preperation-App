import { LeadershipQuestion } from './leadershipTypes';

export const paper5Questions: LeadershipQuestion[] = [
  {
    id: 1,
    category: 'P0 Incident Governance',
    scenario: 'A ransomware attack encrypts 4 core production databases. The attackers demand $2M in Bitcoin. As VP of Engineering / Principal Director, what is your first protocol?',
    options: [
      { id: 'A', text: 'Immediately wire the $2M from company funds without telling the board.' },
      { id: 'B', text: 'Isolate compromised network segments, activate disaster recovery protocol from air-gapped backups, convene the Incident Response Team, and notify Legal/Executive Board.' },
      { id: 'C', text: 'Post a message on Slack blaming the DevOps lead.' },
      { id: 'D', text: 'Format all servers and pretend it was a scheduled reboot.' }
    ],
    correctOption: 'B',
    explanation: 'Crisis protocol demands immediate network containment, activating immutable cold backups, and executing coordinated executive/legal disclosure.'
  },
  {
    id: 2,
    category: 'Board & Executive Alignment',
    scenario: 'The Board of Directors asks you: "Why is our R&D budget 30% higher than last year while feature output seems the same?" How do you address the Board?',
    options: [
      { id: 'A', text: '"Board members don’t understand software, so I won’t explain."' },
      { id: 'B', text: 'Present a strategic financial model: quantify investments in regulatory compliance (SOC2/ISO), platform multi-region reliability, and technical debt reduction that prevented major outages.' },
      { id: 'C', text: 'Blame the engineering recruiters for overpaying developers.' },
      { id: 'D', text: 'Falsify productivity graphs.' }
    ],
    correctOption: 'B',
    explanation: 'Executive leadership communicates engineering value in the language of enterprise risk mitigation, revenue protection, and compliance enablement.'
  },
  {
    id: 3,
    category: 'Digital Transformation',
    scenario: 'Your enterprise has 2,000 engineers using a 15-year-old on-premise mainframe. Leadership mandates migrating to the Cloud in 12 months. What is your transformation strategy?',
    options: [
      { id: 'A', text: 'A "Big Bang" overnight migration on a single weekend.' },
      { id: 'B', text: 'The Strangler Fig Pattern: incrementally peel off high-value edge domains into microservices/serverless, validating security and data consistency at each step.' },
      { id: 'C', text: 'Refuse the mandate and declare the cloud a passing fad.' },
      { id: 'D', text: 'Outsource the entire migration to the lowest bidder.' }
    ],
    correctOption: 'B',
    explanation: 'The Strangler Fig Pattern enables continuous business operation while progressively replacing legacy monoliths without catastrophic multi-million dollar cutover risks.'
  },
  {
    id: 4,
    category: 'Multi-Department Resource Allocation',
    scenario: 'Two business units (Retail and Enterprise B2B) are competing for your core engineering platform team’s capacity. Both claim their initiative will make $10M. How do you resolve?',
    options: [
      { id: 'A', text: 'Give all resources to whichever VP took you to the most expensive dinner.' },
      { id: 'B', text: 'Convene an Executive Portfolio Review: evaluate strategic company-wide alignment, ROI confidence intervals, payback periods, and explore self-service platform APIs.' },
      { id: 'C', text: 'Split the platform team into 50 fragmented sub-teams and deliver half-baked solutions to both.' },
      { id: 'D', text: 'Refuse both requests.' }
    ],
    correctOption: 'B',
    explanation: 'Enterprise portfolio management relies on standardized investment scoring (RICE / Cost of Delay) aligned with corporate strategic objectives.'
  },
  {
    id: 5,
    category: 'Enterprise Security Compliance',
    scenario: 'To close a $50M enterprise contract with a Fortune 50 bank, the client demands FedRAMP and SOC2 Type II compliance within 6 months. What is your approach?',
    options: [
      { id: 'A', text: 'Forge the audit certificates.' },
      { id: 'B', text: 'Form an executive security steering committee, engage an accredited third-party auditor, implement automated continuous compliance tooling, and adjust roadmap capacity.' },
      { id: 'C', text: 'Tell the sales team to drop the client.' },
      { id: 'D', text: 'Ignore the compliance requirements until after signing.' }
    ],
    correctOption: 'B',
    explanation: 'Securing massive tier-1 enterprise contracts requires operationalizing compliance as continuous automated code rather than retroactive paperwork.'
  },
  {
    id: 6,
    category: 'Mergers & Acquisitions (M&A)',
    scenario: 'Your company acquires a competitor’s startup. Their codebase is a messy PHP monolith with no tests, but holds 500,000 active users. How do you integrate them?',
    options: [
      { id: 'A', text: 'Immediately shut down their application and tell users to migrate.' },
      { id: 'B', text: 'Conduct an architectural discovery: isolate the service behind an API gateway, map customer value streams, retain key technical talent, and plan a phased data consolidation.' },
      { id: 'C', text: 'Insult the acquired engineers and fire them all.' },
      { id: 'D', text: 'Leave them completely untouched for 10 years.' }
    ],
    correctOption: 'B',
    explanation: 'Successful post-merger integration balances cultural integration, customer continuity, and gradual API-driven technical consolidation.'
  },
  {
    id: 7,
    category: 'Organizational Design (Conway’s Law)',
    scenario: 'Your engineering organization is struggling with cross-team bottlenecks where shipping a single button requires coordination across 6 separate functional teams. How do you restructure?',
    options: [
      { id: 'A', text: 'Add 10 more project managers to run more status meetings.' },
      { id: 'B', text: 'Reorganize into Stream-Aligned Teams (Team Topologies): cross-functional, full-stack squads aligned to customer journeys, supported by dedicated platform teams.' },
      { id: 'C', text: 'Eliminate all team boundaries and have 500 engineers in one giant pool.' },
      { id: 'D', text: 'Mandate that engineers work on weekends.' }
    ],
    correctOption: 'B',
    explanation: 'Team Topologies principles reorganize teams into autonomous stream-aligned squads and internal platform providers, drastically reducing inter-team coordination overhead.'
  },
  {
    id: 8,
    category: 'Crisis Media Communication',
    scenario: 'A major security breach leaked user data. The press has picked up the story and your stock is falling 8%. What is the CTO / Executive Engineering communication rule?',
    options: [
      { id: 'A', text: 'Go on TV and deny that any breach occurred.' },
      { id: 'B', text: 'Coordinate with Legal & PR: issue a transparent, fact-based statement acknowledging the breach, outline immediate remediation actions taken, and offer victim credit monitoring.' },
      { id: 'C', text: 'Delete the company Twitter account.' },
      { id: 'D', text: 'Blame junior developers in the press.' }
    ],
    correctOption: 'B',
    explanation: 'Transparency, rapid remediation, and taking executive responsibility are the only ways to restore public market and regulatory trust following a breach.'
  },
  {
    id: 9,
    category: 'Enterprise Cloud Cost Governance (FinOps)',
    scenario: 'Your enterprise AWS bill reaches $1.2M/month, exceeding projections by 45%. As VP of Infrastructure, how do you institute FinOps discipline?',
    options: [
      { id: 'A', text: 'Send an all-caps email telling engineers to stop using AWS.' },
      { id: 'B', text: 'Establish a FinOps practice: mandate cost allocation tags, provide squad-level monthly spend dashboards, leverage Savings Plans/Spot instances, and tie cost efficiency to OKRs.' },
      { id: 'C', text: 'Turn off staging environments permanently.' },
      { id: 'D', text: 'Move everything to a basement server.' }
    ],
    correctOption: 'B',
    explanation: 'FinOps succeeds by democratizing cost visibility to the engineering edge and coupling organizational incentives with cloud infrastructure optimization.'
  },
  {
    id: 10,
    category: 'Executive Talent Retention',
    scenario: 'Your top Principal Architect, who holds the entire vision for your distributed platform, receives an offer from Google for 2x their salary. How do you navigate this?',
    options: [
      { id: 'A', text: 'Threaten to sue them for breach of loyalty.' },
      { id: 'B', text: 'Understand their primary motivation (compensation, scope, fatigue): propose a competitive counter-package, expanded strategic board impact, or ensure a structured succession handover if they depart.' },
      { id: 'C', text: 'Lock them out of their laptop immediately.' },
      { id: 'D', text: 'Spread rumors in the tech community.' }
    ],
    correctOption: 'B',
    explanation: 'Executive talent retention combines strategic compensation adjustments with career scope; if unresolvable, respectful departure management ensures smooth knowledge transfer.'
  },
  {
    id: 11,
    category: 'Enterprise Risk Management',
    scenario: 'A single cloud provider (AWS US-East-1) hosts 100% of your global banking infrastructure. The board asks about existential geopolitical and availability risks. What is your strategy?',
    options: [
      { id: 'A', text: 'Tell the board that AWS never goes down.' },
      { id: 'B', text: 'Design a multi-region active-active or active-passive disaster recovery architecture with automated DNS failover (RTO < 15 min, RPO < 1 min) and test it quarterly.' },
      { id: 'C', text: 'Print paper receipts of all transactions.' },
      { id: 'D', text: 'Resign.' }
    ],
    correctOption: 'B',
    explanation: 'Tier-1 enterprise continuity requires multi-region redundancy with rigorous SLAs for Recovery Time Objective (RTO) and Recovery Point Objective (RPO).'
  },
  {
    id: 12,
    category: 'Fostering High-Trust Culture',
    scenario: 'How does an executive engineering leader systematically eliminate fear and foster genuine psychological safety across 500 developers?',
    options: [
      { id: 'A', text: 'Fire anyone who questions company policy to show strength.' },
      { id: 'B', text: 'Model vulnerability publicly (sharing executive post-mortems and miscalculations), reward candid feedback, protect whistleblowers, and establish transparent career rubrics.' },
      { id: 'C', text: 'Put motivational posters on the walls.' },
      { id: 'D', text: 'Pay everyone in pizza.' }
    ],
    correctOption: 'B',
    explanation: 'Psychological safety is modeled from the very top: when executives openly own failures and celebrate dissenting voices, innovation flourishes.'
  },
  {
    id: 13,
    category: 'Vendor Lock-in vs Velocity',
    scenario: 'Your team wants to use AWS DynamoDB and Lambda for everything. A board advisor warns against vendor lock-in and demands using only Kubernetes-portable containers. How do you weigh this?',
    options: [
      { id: 'A', text: 'Always avoid all cloud services to remain 100% cloud agnostic, even if it quadruples operational cost.' },
      { id: 'B', text: 'Analyze pragmatic trade-offs: leveraging managed serverless primitives delivers 3x faster time-to-market. Protect modularity at the business boundary rather than premature generic portability.' },
      { id: 'C', text: 'Build your own cloud provider.' },
      { id: 'D', text: 'Ignore the board advisor.' }
    ],
    correctOption: 'B',
    explanation: 'Premature cloud-agnosticism creates massive self-inflicted operational overhead. Senior leaders leverage cloud-native services while isolating business logic behind clean interfaces.'
  },
  {
    id: 14,
    category: 'Succession Planning',
    scenario: 'As Chief Technology Officer, what is your most critical responsibility regarding your own role?',
    options: [
      { id: 'A', text: 'Ensure that nobody else knows how you run the department so you can never be replaced.' },
      { id: 'B', text: 'Identify and groom 2-3 potential internal successors (VPs/Directors), delegating executive responsibilities and board exposures to ensure organizational continuity.' },
      { id: 'C', text: 'Work until you collapse.' },
      { id: 'D', text: 'Keep all architecture documents locked in your personal desk.' }
    ],
    correctOption: 'B',
    explanation: 'A leader’s lasting legacy is organizational continuity: deliberate succession planning guarantees the enterprise thrives long after the leader transitions.'
  },
  {
    id: 15,
    category: 'Enterprise Data Strategy',
    scenario: 'Every business team is building isolated data silos in Snowflake, BigQuery, and Postgres. Cross-company analytics are broken. How do you govern enterprise data?',
    options: [
      { id: 'A', text: 'Ban all data analytics across the company.' },
      { id: 'B', text: 'Implement a Data Mesh architecture with unified data governance: treat data as a product, define domain data owners, and enforce standardized data schemas and access APIs.' },
      { id: 'C', text: 'Force all 500 databases into one giant Excel sheet.' },
      { id: 'D', text: 'Let everyone build their own disconnected tools.' }
    ],
    correctOption: 'B',
    explanation: 'Data Mesh principles federate data ownership to domain teams while establishing central governance, standardized schemas, and self-service analytics infrastructure.'
  },
  {
    id: 16,
    category: 'AI Strategy & Governance',
    scenario: 'Your enterprise wants to adopt Generative AI across customer support. The Chief Legal Officer warns about data privacy and hallucinations. How do you architect responsibly?',
    options: [
      { id: 'A', text: 'Send raw customer database records directly to public ChatGPT.' },
      { id: 'B', text: 'Implement enterprise LLM governance: deploy private VPC models/APIs with zero data retention, strict PII scrubbing, RAG grounding on verified internal docs, and human-in-the-loop validation.' },
      { id: 'C', text: 'Ban all AI adoption forever.' },
      { id: 'D', text: 'Let the AI issue legal contracts without review.' }
    ],
    correctOption: 'B',
    explanation: 'Enterprise AI deployment requires rigorous boundary controls: zero data-retention guarantees, PII masking, grounded RAG verification, and human oversight.'
  },
  {
    id: 17,
    category: 'Handling Global Disruptions',
    scenario: 'A major undersea internet cable is severed, causing severe latency for 40% of your APAC customer base. What is your high-level infrastructure response?',
    options: [
      { id: 'A', text: 'Tell APAC customers to wait a month until the cable is fixed.' },
      { id: 'B', text: 'Re-route global traffic via Anycast CDN edge points, activate regional read replicas in Tokyo/Singapore, and enable edge-cached degraded experiences for low-bandwidth users.' },
      { id: 'C', text: 'Close your APAC division.' },
      { id: 'D', text: 'Post a message blaming sharks for biting the cable.' }
    ],
    correctOption: 'B',
    explanation: 'Edge computing, CDN point-of-presence (PoP) routing, and localized read replicas ensure high enterprise resilience during geopolitical and physical network disruptions.'
  },
  {
    id: 18,
    category: 'Executive Compensation Alignment',
    scenario: 'How should an engineering executive align developer incentives to prevent short-term hacking and encourage long-term code quality?',
    options: [
      { id: 'A', text: 'Pay bonuses strictly based on lines of code written.' },
      { id: 'B', text: 'Tie performance rewards to holistic DORA metrics, system uptime SLAs, peer mentorship ratings, and business customer satisfaction (NPS).' },
      { id: 'C', text: 'Pay bonuses based on who closes the most Jira tickets regardless of quality.' },
      { id: 'D', text: 'Eliminate all performance reviews and bonuses.' }
    ],
    correctOption: 'B',
    explanation: 'Rewarding balanced metrics (DORA velocity + reliability SLAs + peer mentorship) aligns engineering actions with long-term enterprise health.'
  },
  {
    id: 19,
    category: 'Global Regulatory Compliance',
    scenario: 'The European Union passes strict new AI and digital operational resilience regulations (EU DORA / AI Act). Your company operates in Europe. What is your roadmap?',
    options: [
      { id: 'A', text: 'Ignore it because your company headquarters is in the US.' },
      { id: 'B', text: 'Engage regulatory counsel, conduct a gap audit across operational resilience and AI risk tiers, establish audit-proof telemetry, and certify before the enforcement deadline.' },
      { id: 'C', text: 'Block all European IP addresses.' },
      { id: 'D', text: 'Wait until fined millions of euros to do anything.' }
    ],
    correctOption: 'B',
    explanation: 'Proactive compliance with international regulatory frameworks protects global market access and shields the company from crippling financial penalties.'
  },
  {
    id: 20,
    category: 'Enterprise Architectural Modernization',
    scenario: 'An outdated legacy payment processing system fails 1% of the time, resulting in $20M lost revenue annually. Board approves a $5M overhaul. How do you govern the project?',
    options: [
      { id: 'A', text: 'Hand the $5M to an external consultancy with zero internal oversight.' },
      { id: 'B', text: 'Form a dedicated internal core engineering tiger team, establish clear milestone gates (Phase 1: shadow routing & telemetry; Phase 2: canary 5%; Phase 3: full cutover), and track ROI weekly.' },
      { id: 'C', text: 'Rewrite the code overnight and deploy without shadow testing.' },
      { id: 'D', text: 'Spend the $5M on marketing instead.' }
    ],
    correctOption: 'B',
    explanation: 'High-stakes core system modernization succeeds through internal engineering ownership, shadow/canary validation phases, and strict executive milestone gates.'
  },
  {
    id: 21,
    category: 'Leading Organizational Layoffs with Dignity',
    scenario: 'Due to severe economic downturn, the executive committee mandates a 15% workforce reduction across engineering. As VP of Engineering, how do you handle this?',
    options: [
      { id: 'A', text: 'Lock everyone out of Slack with a generic 2-line AI email at midnight.' },
      { id: 'B', text: 'Lead with empathy and dignity: provide generous severance and healthcare continuation, conduct respectful transparent conversations, and hold an all-hands to support remaining staff.' },
      { id: 'C', text: 'Resign the day before to avoid having difficult conversations.' },
      { id: 'D', text: 'Blame the affected engineers for being bad performers.' }
    ],
    correctOption: 'B',
    explanation: 'How leadership conducts workforce reductions defines company culture for decades. Treating departing colleagues with deep humanity, dignity, and generous support is a moral imperative.'
  },
  {
    id: 22,
    category: 'Enterprise Zero Trust Architecture',
    scenario: 'A corporate employee laptop is compromised at an airport. Why does a Zero Trust security posture protect the enterprise?',
    options: [
      { id: 'A', text: 'Because laptops on airport Wi-Fi cannot connect to the internet.' },
      { id: 'B', text: 'Because Zero Trust assumes breach: every request requires continuous mTLS authentication, device health attestation, and least-privilege RBAC, preventing lateral movement.' },
      { id: 'C', text: 'Because VPNs guarantee 100% protection from hackers.' },
      { id: 'D', text: 'Zero Trust does not prevent breaches.' }
    ],
    correctOption: 'B',
    explanation: 'Zero Trust architecture ("Never trust, always verify") prevents an endpoint compromise from turning into a full enterprise network takeover.'
  },
  {
    id: 23,
    category: 'Open Source Strategy',
    scenario: 'Your engineering organization wants to open-source an internal distributed cache tool you developed. What is the executive decision framework?',
    options: [
      { id: 'A', text: 'Never open-source anything because competitors will steal it.' },
      { id: 'B', text: 'Evaluate: Is it core intellectual property? If it is tooling/infrastructure, open-sourcing attracts world-class engineering talent, establishes industry leadership, and drives community improvements.' },
      { id: 'C', text: 'Upload it to GitHub with no license or documentation.' },
      { id: 'D', text: 'Charge developers $10 to download it.' }
    ],
    correctOption: 'B',
    explanation: 'Open-sourcing foundational non-differentiating infrastructure builds massive employer brand equity and attracts tier-1 engineering talent globally.'
  },
  {
    id: 24,
    category: 'Engineering Metric Pitfalls',
    scenario: 'The Chief Operating Officer proposes evaluating engineers by counting commits and Jira tickets closed per week. How do you respond?',
    options: [
      { id: 'A', text: 'Agree enthusiastically because numbers are easy to track.' },
      { id: 'B', text: 'Explain the flaw: engineers will game the system by splitting 1 commit into 50 trivial commits. Advocate instead for customer outcomes, DORA lead time, and system reliability.' },
      { id: 'C', text: 'Tell the COO they know nothing about management.' },
      { id: 'D', text: 'Start committing single spaces to top the leaderboard.' }
    ],
    correctOption: 'B',
    explanation: 'Flawed proxy metrics distort engineering incentives. Evaluating holistic business outcomes and DORA throughput prevents destructive metric gaming.'
  },
  {
    id: 25,
    category: 'Leading Through Major Outages',
    scenario: 'During your company’s biggest public IPO launch, your homepage goes down worldwide. Social media is on fire. As the CTO, what is your mindset?',
    options: [
      { id: 'A', text: 'Panic, scream at the on-call engineer, and hide from executives.' },
      { id: 'B', text: 'Radiate calm: establish command hierarchy, shield the technical incident team from executive panic, provide clear 10-minute briefing updates, and execute rollback.' },
      { id: 'C', text: 'Delete your social media profiles.' },
      { id: 'D', text: 'Call the journalists directly to argue with them.' }
    ],
    correctOption: 'B',
    explanation: 'Executive calm is contagious. Protecting engineers from executive noise enables fast, rational triage and recovery under extreme global scrutiny.'
  },
  {
    id: 26,
    category: 'Sustainable Scale Architecture',
    scenario: 'Your company is expanding from 1 million to 100 million active users. What architectural paradigm must you establish early?',
    options: [
      { id: 'A', text: 'Buy the biggest single server available from Dell.' },
      { id: 'B', text: 'Horizontal scalability, stateless microservices, read-heavy caching tiers (Redis/CDN), database sharding/partitioning, and asynchronous event-driven queues.' },
      { id: 'C', text: 'Store all data in browser cookies.' },
      { id: 'D', text: 'Ask users to use the website only during business hours.' }
    ],
    correctOption: 'B',
    explanation: 'Scaling to 100M users demands horizontal elasticity, asynchronous decoupling, and multi-tiered caching to prevent database saturation.'
  },
  {
    id: 27,
    category: 'Executive Coaching & Mentorship',
    scenario: 'You have a newly promoted Director of Engineering who is struggling with delegating to their managers and is working 80 hours a week. How do you coach them?',
    options: [
      { id: 'A', text: 'Tell them that being a Director means working 80 hours a week forever.' },
      { id: 'B', text: 'Help them transition from "managing managers" mindset: focus on organizational design, setting strategic context, establishing metrics, and empowering their managers to own execution.' },
      { id: 'C', text: 'Demote them back to senior engineer immediately.' },
      { id: 'D', text: 'Ignore them until they quit.' }
    ],
    correctOption: 'B',
    explanation: 'Managing managers requires shifting from operational task tracking to organizational design, setting strategic guardrails, and coaching people leadership.'
  },
  {
    id: 28,
    category: 'Vendor Dependency Risk',
    scenario: 'Your entire core product relies on an AI API from a startup that has 3 months of runway left. What is your risk mitigation strategy?',
    options: [
      { id: 'A', text: 'Hope they get acquired by Microsoft and do nothing.' },
      { id: 'B', text: 'Build an abstraction adapter layer (gateway) decoupling your code from the vendor, and establish active integration with open-source models (Llama/Mistral) as fallback.' },
      { id: 'C', text: 'Give them all your company’s cash.' },
      { id: 'D', text: 'Shut down your product.' }
    ],
    correctOption: 'B',
    explanation: 'Decoupling external vendor dependencies through provider-agnostic abstractions eliminates existential business risk if a supplier collapses.'
  },
  {
    id: 29,
    category: 'Internal Platform Engineering',
    scenario: 'Your 300 engineers spend 25% of their time configuring Kubernetes YAML, Dockerfiles, and CI/CD pipelines instead of shipping customer features. How do you solve this?',
    options: [
      { id: 'A', text: 'Tell all engineers they must become certified Kubernetes administrators.' },
      { id: 'B', text: 'Invest in an Internal Developer Platform (IDP) with self-service Golden Paths: standardized templates where developers can deploy services with one click.' },
      { id: 'C', text: 'Ban Kubernetes and go back to FTP file uploads.' },
      { id: 'D', text: 'Fire the developers who complain.' }
    ],
    correctOption: 'B',
    explanation: 'Internal Developer Platforms (IDPs) and "Golden Paths" free product engineers from infrastructure cognitive overload, multiplying organization-wide delivery velocity.'
  },
  {
    id: 30,
    category: 'Enterprise Knowledge Management',
    scenario: 'Engineering knowledge is scattered across Google Docs, Confluence, Slack threads, and private brains. How do you institute knowledge governance?',
    options: [
      { id: 'A', text: 'Hire 10 full-time librarians.' },
      { id: 'B', text: 'Establish Docs-as-Code in markdown inside git repositories, integrate an enterprise semantic search tool, and mandate architectural decisions documented in ADRs.' },
      { id: 'C', text: 'Ban documentation completely.' },
      { id: 'D', text: 'Tell developers to memorize everything.' }
    ],
    correctOption: 'B',
    explanation: 'Docs-as-code keeps documentation alongside source code, subject to pull request reviews and versioning, keeping knowledge fresh and discoverable.'
  },
  {
    id: 31,
    category: 'Budgeting & Headcount Planning',
    scenario: 'You are submitting next fiscal year’s engineering headcount budget. What data points build an unshakeable proposal for the CFO?',
    options: [
      { id: 'A', text: '"I want 50 more engineers because more people are always better."' },
      { id: 'B', text: 'Tie headcount directly to projected business revenue streams, customer contract delivery dates, and platform reliability cost-benefit models.' },
      { id: 'C', text: 'Threaten that all current engineers will quit if budget isn’t doubled.' },
      { id: 'D', text: 'Copy-paste another company’s budget from Google.' }
    ],
    correctOption: 'B',
    explanation: 'CFOs approve headcount when engineering requests are directly tied to revenue growth, customer commitments, and quantifiable risk mitigation.'
  },
  {
    id: 32,
    category: 'Ethics & Algorithmic Bias',
    scenario: 'Your AI candidate screening model is discovered to score female applicants 20% lower for software engineering roles due to historical training data bias. What do you do?',
    options: [
      { id: 'A', text: 'Keep using it because the AI is mathematical and therefore objective.' },
      { id: 'B', text: 'Halt production use immediately, disclose findings transparently, retrain with debiased datasets and fairness constraints, and mandate human review.' },
      { id: 'C', text: 'Delete the audit report.' },
      { id: 'D', text: 'Blame the applicants.' }
    ],
    correctOption: 'B',
    explanation: 'Algorithmic bias reflects historical training prejudices; ethical engineering leaders halt biased automated models and mandate algorithmic fairness.'
  },
  {
    id: 33,
    category: 'Strategic Technical Debt Buyout',
    scenario: 'Your legacy billing engine is so fragile that even minor changes take 3 months and cause revenue loss. The CEO asks for an executive recommendation. What is it?',
    options: [
      { id: 'A', text: '"Let’s patch it forever and hope it holds."' },
      { id: 'B', text: 'Propose a funded 6-month parallel rewrite with dual-write validation and automated reconciliation, demonstrating positive ROI within 12 months.' },
      { id: 'C', text: 'Recommend closing the company billing department.' },
      { id: 'D', text: 'Quit.' }
    ],
    correctOption: 'B',
    explanation: 'Dual-write and automated reconciliation patterns allow safe replatforming of mission-critical financial cores with zero customer interruption.'
  },
  {
    id: 34,
    category: 'Cross-Organizational Diplomacy',
    scenario: 'The VP of Product and VP of Sales are in an open feud over roadmap priorities. How does the VP of Engineering facilitate alignment?',
    options: [
      { id: 'A', text: 'Take sides with Sales because they bring in money.' },
      { id: 'B', text: 'Act as an objective mediator: anchor discussions in strategic corporate goals, present transparent engineering capacity models, and establish a balanced portfolio framework.' },
      { id: 'C', text: 'Ignore both and build whatever you want.' },
      { id: 'D', text: 'Escalate to the board to have both fired.' }
    ],
    correctOption: 'B',
    explanation: 'Engineering executives serve as neutral, objective arbiters by anchoring decisions in data, capacity reality, and corporate strategy.'
  },
  {
    id: 35,
    category: 'Enterprise Disaster Recovery Drills',
    scenario: 'Why should an enterprise conduct unannounced production failover simulations (GameDays)?',
    options: [
      { id: 'A', text: 'To torment engineers on a Friday.' },
      { id: 'B', text: 'To prove that disaster recovery documentation, DNS failovers, and backup restorations actually work in practice rather than existing as theoretical compliance checkboxes.' },
      { id: 'C', text: 'Because cloud providers require it.' },
      { id: 'D', text: 'To crash production.' }
    ],
    correctOption: 'B',
    explanation: 'Untested disaster recovery plans fail 100% of the time during real crises. Regular simulation is the only proof of operational resilience.'
  },
  {
    id: 36,
    category: 'Fostering Engineering Pride',
    scenario: 'Your engineering organization has suffered high attrition and morale is at an all-time low. How do you rebuild pride and purpose?',
    options: [
      { id: 'A', text: 'Give everyone a branded coffee mug.' },
      { id: 'B', text: 'Clarify the inspiring company mission, remove bureaucratic friction, empower bottom-up innovation, celebrate team wins publicly, and invest in career growth.' },
      { id: 'C', text: 'Threaten to cancel all remote work.' },
      { id: 'D', text: 'Hire expensive motivational speakers.' }
    ],
    correctOption: 'B',
    explanation: 'Genuine pride returns when leaders eliminate frustrating bureaucratic roadblocks, honor craftsmanship, and connect engineering work to meaningful impact.'
  },
  {
    id: 37,
    category: 'Multi-Cloud Strategy Truth',
    scenario: 'A consulting firm recommends spending $10M to make your application simultaneously run on AWS, Azure, and Google Cloud at all times. How do you evaluate?',
    options: [
      { id: 'A', text: 'Sign the contract immediately.' },
      { id: 'B', text: 'Reject the proposal: true active-active multi-cloud multiplies networking costs, latency, and operational complexity by 10x for minimal reliability gain. Invest in multi-region on one cloud instead.' },
      { id: 'C', text: 'Migrate to 10 different clouds.' },
      { id: 'D', text: 'Fire your cloud team.' }
    ],
    correctOption: 'B',
    explanation: 'Active-active multi-cloud is almost always an enterprise anti-pattern. Multi-region within a single mature provider yields 99.99% availability at a fraction of the cost and complexity.'
  },
  {
    id: 38,
    category: 'Intellectual Property Protection',
    scenario: 'A departing senior engineer attempts to download 40 proprietary Git repositories to an external hard drive on their last day. What is the enterprise protocol?',
    options: [
      { id: 'A', text: 'Let them have it as a souvenir.' },
      { id: 'B', text: 'Data Loss Prevention (DLP) alerts security: automatically revoke access tokens, confiscate company hardware, notify Legal, and conduct an audit of exfiltrated data.' },
      { id: 'C', text: 'Wish them luck at their new company.' },
      { id: 'D', text: 'Ask them to share the download link.' }
    ],
    correctOption: 'B',
    explanation: 'Protecting proprietary intellectual property through automated Data Loss Prevention (DLP) and immediate legal response is critical for enterprise survival.'
  },
  {
    id: 39,
    category: 'Executive Integrity',
    scenario: 'You discover that an earlier audit report presented to investors contained inflated performance metrics submitted by your predecessor. What do you do?',
    options: [
      { id: 'A', text: 'Cover it up and hope nobody ever finds out.' },
      { id: 'B', text: 'Brief the CEO, General Counsel, and Audit Committee immediately with the verified accurate data, and collaborate on a transparent correction strategy.' },
      { id: 'C', text: 'Resign silently without telling anyone.' },
      { id: 'D', text: 'Blackmail the predecessor.' }
    ],
    correctOption: 'B',
    explanation: 'Uncompromising integrity is the bedrock of executive leadership. Discovering and correcting misleading investor disclosures protects the company from catastrophic fraud litigation.'
  },
  {
    id: 40,
    category: 'The Essence of Executive Engineering Leadership',
    scenario: 'At the highest level of executive engineering leadership (CTO / VP / Fellow), what is your ultimate contribution to the enterprise?',
    options: [
      { id: 'A', text: 'Writing the fastest sorting algorithms in the company.' },
      { id: 'B', text: 'Aligning world-class technical talent, resilient architecture, and ethical culture with durable business value and long-term customer trust.' },
      { id: 'C', text: 'Managing the most JIRA tickets in the organization.' },
      { id: 'D', text: 'Having an executive corner office.' }
    ],
    correctOption: 'B',
    explanation: 'Executive engineering leadership is the art of harmonizing people, architecture, and strategy into an engine of continuous, ethical, and high-impact business innovation.'
  }
];
