import { LeadershipQuestion } from './leadershipTypes';

export const paper1Questions: LeadershipQuestion[] = [
  {
    id: 1,
    category: 'Task Ownership',
    scenario: 'You are an intern assigned to complete a bug fix by end-of-day. By 3 PM, you realize you do not understand the legacy codebase module causing the bug. What is the most professional action?',
    options: [
      { id: 'A', text: 'Work late silently until midnight trying to figure it out yourself without bothering anyone.' },
      { id: 'B', text: 'Document the steps you have investigated and ask your mentor or buddy for 15 minutes of guidance.' },
      { id: 'C', text: 'Wait until the morning standup tomorrow to announce that the task was too complicated.' },
      { id: 'D', text: 'Reassign the ticket back to the sprint backlog without telling the team.' }
    ],
    correctOption: 'B',
    explanation: 'Demonstrating self-reliance by documenting what you already tried, followed by timely escalation before the deadline, is the hallmark of proactive ownership.'
  },
  {
    id: 2,
    category: 'Receiving Feedback',
    scenario: 'During your first pull request review, a senior engineer leaves 12 comments pointing out code smells and missing unit tests. How should you respond?',
    options: [
      { id: 'A', text: 'Feel discouraged and avoid working on that repository again.' },
      { id: 'B', text: 'Argue that the code works on your local machine so the review is overly nitpicky.' },
      { id: 'C', text: 'Thank the reviewer, address each comment methodically, and ask clarifying questions on suggestions you do not understand.' },
      { id: 'D', text: 'Close the pull request and open a new one hoping a different engineer reviews it.' }
    ],
    correctOption: 'C',
    explanation: 'Code reviews are a mentorship opportunity. Responding constructively with gratitude and curiosity establishes high coachability.'
  },
  {
    id: 3,
    category: 'Communication',
    scenario: 'Your mentor assigned you a task but their verbal instructions were vague and did not specify edge cases. What should you do?',
    options: [
      { id: 'A', text: 'Guess the requirements based on your assumptions and hope for the best.' },
      { id: 'B', text: 'Write a brief message summarizing your understanding of the scope and acceptance criteria to get confirmation.' },
      { id: 'C', text: 'Wait until the end of the sprint to see if someone notices.' },
      { id: 'D', text: 'Complain to another intern about the mentor’s communication skills.' }
    ],
    correctOption: 'B',
    explanation: 'Written alignment ensures both parties agree on scope and prevents wasted effort due to misaligned expectations.'
  },
  {
    id: 4,
    category: 'Admitting Mistakes',
    scenario: 'While testing a database script on what you thought was a local test database, you accidentally altered records in a shared staging environment. What is your immediate response?',
    options: [
      { id: 'A', text: 'Immediately notify your team in the engineering Slack channel, explain what happened, and assist in rolling back.' },
      { id: 'B', text: 'Quickly close your terminal and pretend you know nothing about the issue.' },
      { id: 'C', text: 'Try to manually write custom SQL updates to reverse the records without telling anyone.' },
      { id: 'D', text: 'Blame the devops configuration for not having strict permissions.' }
    ],
    correctOption: 'A',
    explanation: 'Integrity and rapid transparency minimize incident blast radius. Engineers respect immediate honesty and collaboration during outages.'
  },
  {
    id: 5,
    category: 'Team Collaboration',
    scenario: 'Another intern on your team is struggling to setup their local Docker development environment and is falling behind. You finished your setup yesterday. What do you do?',
    options: [
      { id: 'A', text: 'Focus only on your own sprint tasks so you look better than them in the final evaluation.' },
      { id: 'B', text: 'Offer 20 minutes to pair with them, share your troubleshooting notes, and update the team README documentation.' },
      { id: 'C', text: 'Tell them to Google the error messages like you did.' },
      { id: 'D', text: 'Report to the Engineering Manager that the other intern is unequipped.' }
    ],
    correctOption: 'B',
    explanation: 'Team multipliers lift others and contribute documentation so future onboarding is seamless.'
  },
  {
    id: 6,
    category: 'Time Management',
    scenario: 'You are invited to three optional company webinars on the same day you have committed to deliver a sprint feature. What should you prioritize?',
    options: [
      { id: 'A', text: 'Attend all three webinars because continuous learning is encouraged.' },
      { id: 'B', text: 'Communicate with your mentor, decline or record the webinars, and focus on delivering your sprint commitment.' },
      { id: 'C', text: 'Attend the webinars and ask for a deadline extension at the last hour.' },
      { id: 'D', text: 'Log into the webinars while coding at the same time with the sound muted.' }
    ],
    correctOption: 'B',
    explanation: 'Reliability on core sprint commitments takes precedence over optional activities. Recording webinars allows learning without sacrificing accountability.'
  },
  {
    id: 7,
    category: 'Workplace Ethics',
    scenario: 'You notice API keys hardcoded in an open public GitHub repository belonging to your team. What should you do?',
    options: [
      { id: 'A', text: 'Ignore it because a senior engineer probably wrote it for a reason.' },
      { id: 'B', text: 'Immediately alert your team lead and security champion privately and suggest rotating the credential.' },
      { id: 'C', text: 'Post a tweet warning people about your company’s security.' },
      { id: 'D', text: 'Fork the repository to your personal account.' }
    ],
    correctOption: 'B',
    explanation: 'Responsible internal disclosure allows rapid credential rotation and security containment.'
  },
  {
    id: 8,
    category: 'Proactive Learning',
    scenario: 'You finish your assigned sprint tasks 2 days before the sprint ends. What is the best course of action?',
    options: [
      { id: 'A', text: 'Relax and browse social media quietly until the new sprint starts.' },
      { id: 'B', text: 'Inform your tech lead, review open unassigned backlog tickets, or help write unit tests and documentation.' },
      { id: 'C', text: 'Start refactoring the entire core architecture without consulting anyone.' },
      { id: 'D', text: 'Leave early each day since you completed your required hours of work.' }
    ],
    correctOption: 'B',
    explanation: 'Proactively signaling availability and picking up secondary tickets or tests shows high initiative.'
  },
  {
    id: 9,
    category: 'Active Listening',
    scenario: 'During an architecture walkthrough, the lead engineer mentions a constraint that you do not fully grasp. When is the best time to clarify?',
    options: [
      { id: 'A', text: 'Interrupt mid-sentence loudly to say you don’t get it.' },
      { id: 'B', text: 'Wait for a pause or the Q&A segment, or note it down and ask for a brief clarification right after the meeting.' },
      { id: 'C', text: 'Never ask, to avoid looking inexperienced.' },
      { id: 'D', text: 'Nod along and pretend you understand completely.' }
    ],
    correctOption: 'B',
    explanation: 'Respectful, targeted inquiries during Q&A demonstrate active listening without disrupting meeting cadence.'
  },
  {
    id: 10,
    category: 'Agile Mindset',
    scenario: 'In the daily standup, what is the most appropriate way for an intern to report their progress?',
    options: [
      { id: 'A', text: 'Give a 15-minute line-by-line explanation of every function you typed yesterday.' },
      { id: 'B', text: 'Say "Everything is fine, no updates" even though you are stuck on a bug.' },
      { id: 'C', text: 'Concise 1-minute update: what you achieved yesterday, what you plan to do today, and any blocker you have.' },
      { id: 'D', text: 'Discuss non-work social plans for the upcoming weekend.' }
    ],
    correctOption: 'C',
    explanation: 'Standup discipline is about transparency, brevity, and highlighting blockers early.'
  },
  {
    id: 11,
    category: 'Handling Ambiguity',
    scenario: 'You are asked to investigate why user signups dropped 5% on Tuesday. There is no predefined runbook. How do you start?',
    options: [
      { id: 'A', text: 'Say you cannot do the task because there are no step-by-step instructions.' },
      { id: 'B', text: 'Formulate 2-3 hypotheses (e.g. error logs, release deployments, third-party auth outages) and gather log data systematically.' },
      { id: 'C', text: 'Guess that the internet was slow on Tuesday and close the ticket.' },
      { id: 'D', text: 'Ask your manager to do the analysis for you.' }
    ],
    correctOption: 'B',
    explanation: 'Approaching open-ended questions with structured hypotheses shows engineering problem-solving maturity.'
  },
  {
    id: 12,
    category: 'Respecting Diversity',
    scenario: 'A colleague from a different time zone and cultural background communicates very directly in code reviews. You feel slightly offended. What should you do?',
    options: [
      { id: 'A', text: 'Assume positive intent, realize communication styles differ across cultures, and focus on the technical merit of the feedback.' },
      { id: 'B', text: 'Reply with passive-aggressive comments in the pull request.' },
      { id: 'C', text: 'Complain to HR immediately before speaking to anyone.' },
      { id: 'D', text: 'Block the colleague on Slack.' }
    ],
    correctOption: 'A',
    explanation: 'Assuming positive intent and understanding cultural nuances prevents friction and builds inclusive teamwork.'
  },
  {
    id: 13,
    category: 'Documentation',
    scenario: 'You spent 3 hours figuring out how to configure an internal VPN certificate that wasn’t documented in the onboarding guide. What should you do?',
    options: [
      { id: 'A', text: 'Keep the steps in your private notebook so you are the only one who knows.' },
      { id: 'B', text: 'Update the team wiki / onboarding docs and submit a PR so the next new joiner saves 3 hours.' },
      { id: 'C', text: 'Delete your notes once it is working.' },
      { id: 'D', text: 'Complain that onboarding is terrible in the all-hands meeting.' }
    ],
    correctOption: 'B',
    explanation: 'Leaving the campsite cleaner than you found it is a core engineering value that multiplies team efficiency.'
  },
  {
    id: 14,
    category: 'Pair Programming',
    scenario: 'During a pair programming session with a senior engineer, they ask you to take the driver seat (typing the code). You feel nervous. How do you handle it?',
    options: [
      { id: 'A', text: 'Refuse and insist that the senior engineer writes all the code while you watch.' },
      { id: 'B', text: 'Accept willingly, verbalize your thought process as you type, and ask for guidance when unsure.' },
      { id: 'C', text: 'Pretend your keyboard is broken.' },
      { id: 'D', text: 'Type randomly without explaining anything.' }
    ],
    correctOption: 'B',
    explanation: 'Verbalizing your thoughts while driving code helps the mentor guide your logic and provides the best learning experience.'
  },
  {
    id: 15,
    category: 'Prioritization',
    scenario: 'You have a bug fix ticket and an internal documentation ticket due this week. Your mentor gives you an urgent ad-hoc data extraction request. What do you do?',
    options: [
      { id: 'A', text: 'Silently drop your existing sprint tickets.' },
      { id: 'B', text: 'Clarify priority with your mentor: "Should I prioritize this ad-hoc request over the bug fix due tomorrow?"' },
      { id: 'C', text: 'Tell your mentor that interns don’t do ad-hoc tasks.' },
      { id: 'D', text: 'Rush all three poorly and submit broken code.' }
    ],
    correctOption: 'B',
    explanation: 'Clarifying trade-offs with stakeholders prevents missed commitments and ensures alignment.'
  },
  {
    id: 16,
    category: 'Conflict Management',
    scenario: 'Another intern disagrees with your proposed naming convention for a shared utility function. How do you resolve it?',
    options: [
      { id: 'A', text: 'Engage in an endless comment war on GitHub.' },
      { id: 'B', text: 'Check the team style guide / ESLint rules or consult a senior engineer to settle the standard objectively.' },
      { id: 'C', text: 'Delete their code when they are away from their desk.' },
      { id: 'D', text: 'Refuse to approve their PR until they yield to your preference.' }
    ],
    correctOption: 'B',
    explanation: 'Relying on established team standards depersonalizes disagreements and yields consistent codebases.'
  },
  {
    id: 17,
    category: 'Continuous Improvement',
    scenario: 'Your team holds a bi-weekly sprint retrospective. As an intern, should you share observations?',
    options: [
      { id: 'A', text: 'Stay completely silent because interns have no right to speak in retrospectives.' },
      { id: 'B', text: 'Share honest, constructive feedback about onboarding friction or team toolings with a solution-oriented tone.' },
      { id: 'C', text: 'Use the retro to publicly criticize specific team members.' },
      { id: 'D', text: 'Skip the retrospective meeting altogether.' }
    ],
    correctOption: 'B',
    explanation: 'Fresh eyes often spot bottlenecks that tenured engineers overlook. Constructive input is welcomed in high-performing teams.'
  },
  {
    id: 18,
    category: 'Customer Focus',
    scenario: 'While reviewing a UI mock, you notice that a form button is confusingly labeled and might cause users to accidentally delete their profile. What do you do?',
    options: [
      { id: 'A', text: 'Implement it exactly as mocked because it is not an intern’s job to question designs.' },
      { id: 'B', text: 'Politely flag the usability concern to the UI/UX designer and suggest a confirmation dialog or clearer label.' },
      { id: 'C', text: 'Change the design completely on your own without telling the designer or team.' },
      { id: 'D', text: 'Ignore it and hope users don’t click it.' }
    ],
    correctOption: 'B',
    explanation: 'User empathy combined with collaborative communication protects user experience and product quality.'
  },
  {
    id: 19,
    category: 'Stress Management',
    scenario: 'A major release deadline is in 24 hours and the entire team is stressed with last-minute bugs. How do you maintain composure?',
    options: [
      { id: 'A', text: 'Panic and post frantic messages in every Slack channel.' },
      { id: 'B', text: 'Stay calm, focus on your specific assigned verification tasks, and ask how you can best support the team.' },
      { id: 'C', text: 'Call in sick to avoid the pressure.' },
      { id: 'D', text: 'Push untested code directly to the main branch to finish faster.' }
    ],
    correctOption: 'B',
    explanation: 'Calm execution and willingness to assist under pressure build long-term trust in an engineer.'
  },
  {
    id: 20,
    category: 'Security Awareness',
    scenario: 'A vendor sends you an email with an attachment claiming to be an updated SDK patch for your task. What should you do?',
    options: [
      { id: 'A', text: 'Download and run the executable immediately on your work laptop.' },
      { id: 'B', text: 'Verify the sender, check official package registries (npm/pip), and report suspicious emails to the IT security team.' },
      { id: 'C', text: 'Forward the email to all other interns to try it first.' },
      { id: 'D', text: 'Disable your antivirus to let it install.' }
    ],
    correctOption: 'B',
    explanation: 'Security vigilance against phishing and supply chain malware is critical for every engineer regardless of seniority.'
  },
  {
    id: 21,
    category: 'Task Ownership',
    scenario: 'You notice that a unit test suite has been flaky (randomly failing on CI) for two weeks. It is not directly related to your ticket. What do you do?',
    options: [
      { id: 'A', text: 'Re-run CI 5 times until it passes and ignore the failure.' },
      { id: 'B', text: 'Document the specific test name, file an issue with logs, and flag it to the QA/Lead engineer.' },
      { id: 'C', text: 'Delete the test completely from the repository.' },
      { id: 'D', text: 'Disable CI checks on your branch.' }
    ],
    correctOption: 'B',
    explanation: 'Flagging technical debt and test flakes with concrete reproducible logs helps maintain CI reliability.'
  },
  {
    id: 22,
    category: 'Communication',
    scenario: 'You are going to be 20 minutes late to work due to an unexpected transit delay. What should you do?',
    options: [
      { id: 'A', text: 'Slip in quietly without saying anything and hope nobody noticed.' },
      { id: 'B', text: 'Send a quick message on the team channel as soon as safely possible letting them know your ETA.' },
      { id: 'C', text: 'Take the whole day off instead.' },
      { id: 'D', text: 'Make up an elaborate false excuse when you arrive.' }
    ],
    correctOption: 'B',
    explanation: 'Simple, timely heads-up notifications show respect for colleagues’ schedules and meetings.'
  },
  {
    id: 23,
    category: 'Constructive Inquiry',
    scenario: 'You notice a function in the codebase with deeply nested if-statements that seems inefficient. How do you inquire about it?',
    options: [
      { id: 'A', text: 'Write in Slack: "Who wrote this terrible garbage function?"' },
      { id: 'B', text: 'Ask your buddy: "I noticed this logic in module X. Could you help me understand the context or constraints behind it?"' },
      { id: 'C', text: 'Completely rewrite it without tests on your own time.' },
      { id: 'D', text: 'Mock the author behind their back.' }
    ],
    correctOption: 'B',
    explanation: 'Approaching historical code with curiosity (Chesterton’s Fence) prevents accidental regressions and respects prior constraints.'
  },
  {
    id: 24,
    category: 'Professionalism',
    scenario: 'During a team lunch, colleagues start gossiping about a colleague who was recently laid off. How do you handle this?',
    options: [
      { id: 'A', text: 'Join in enthusiastically and add unverified rumors.' },
      { id: 'B', text: 'Politely redirect the conversation to a work or neutral topic and avoid participating in gossip.' },
      { id: 'C', text: 'Record the conversation on your phone.' },
      { id: 'D', text: 'Spread the rumors to other departments.' }
    ],
    correctOption: 'B',
    explanation: 'Maintaining professional integrity and discouraging gossip fosters a psychologically safe culture.'
  },
  {
    id: 25,
    category: 'Mentorship Utilization',
    scenario: 'Your assigned mentor has not scheduled your 1-on-1 for two weeks because they seem very busy. What should you do?',
    options: [
      { id: 'A', text: 'Wait indefinitely and feel neglected.' },
      { id: 'B', text: 'Send a friendly message proposing a 20-minute sync at a time convenient for them, with a brief agenda of your questions.' },
      { id: 'C', text: 'Complain to the CTO that your mentor is useless.' },
      { id: 'D', text: 'Stop working until someone notices.' }
    ],
    correctOption: 'B',
    explanation: 'Managing up by proposing a time and an agenda makes it easy for busy mentors to support you effectively.'
  },
  {
    id: 26,
    category: 'Scope Management',
    scenario: 'While fixing a typo on a button, you feel tempted to also rewrite the entire button CSS framework. What should you do?',
    options: [
      { id: 'A', text: 'Keep the PR strictly scoped to the typo fix, and create a separate backlog proposal for the CSS overhaul.' },
      { id: 'B', text: 'Combine both changes into one massive 50-file PR.' },
      { id: 'C', text: 'Rewrite the CSS and skip fixing the typo.' },
      { id: 'D', text: 'Ask the team to freeze all deployments while you redesign.' }
    ],
    correctOption: 'A',
    explanation: 'Atomic, tightly-scoped pull requests are faster to review, test, and revert if something breaks.'
  },
  {
    id: 27,
    category: 'Self-Direction',
    scenario: 'Your mentor is out sick today and you have finished your ticket. What is the most productive action?',
    options: [
      { id: 'A', text: 'Play video games at your desk all day.' },
      { id: 'B', text: 'Check the team documentation, explore backlog bug tickets labeled "good first issue", or write unit tests.' },
      { id: 'C', text: 'Go home without telling anyone.' },
      { id: 'D', text: 'Call your sick mentor repeatedly.' }
    ],
    correctOption: 'B',
    explanation: 'Autonomous initiative to tackle documented low-hanging fruit demonstrates professional maturity.'
  },
  {
    id: 28,
    category: 'Code Quality',
    scenario: 'You can fix a bug by copy-pasting a 50-line snippet from StackOverflow that you do not fully understand. What should you do?',
    options: [
      { id: 'A', text: 'Paste it into production and commit it if it stops the error.' },
      { id: 'B', text: 'Take time to understand each line, verify licensing, refactor it cleanly into your project standards, and add tests.' },
      { id: 'C', text: 'Change variable names to make it look like you wrote it and hide it.' },
      { id: 'D', text: 'Leave the bug unfixed.' }
    ],
    correctOption: 'B',
    explanation: 'Engineers are responsible for every line of code they commit. Understanding and testing imported logic prevents vulnerabilities.'
  },
  {
    id: 29,
    category: 'Goal Setting',
    scenario: 'At the start of your internship, your manager asks for your goals. What is the best way to frame them?',
    options: [
      { id: 'A', text: 'Say "I just want to get paid and get an internship certificate."' },
      { id: 'B', text: 'Set SMART goals: Learn the tech stack, ship at least 3 customer-facing features, and master writing integration tests.' },
      { id: 'C', text: 'Tell them you want to become the VP of Engineering in 2 months.' },
      { id: 'D', text: 'Say you don’t believe in setting goals.' }
    ],
    correctOption: 'B',
    explanation: 'Specific, measurable, and realistic goals aligned with company deliverables show maturity and drive.'
  },
  {
    id: 30,
    category: 'Empathy in Code Reviews',
    scenario: 'You are reviewing another junior engineer’s PR and notice they made a simple syntax mistake. How do you comment?',
    options: [
      { id: 'A', text: '"How did you not see this? Are you even a developer?"' },
      { id: 'B', text: '"Good catch on the main logic! Looks like line 24 has a small syntax typo—here is a quick suggestion."' },
      { id: 'C', text: 'Reject the PR with no comment.' },
      { id: 'D', text: 'Send an email to their manager pointing out the error.' }
    ],
    correctOption: 'B',
    explanation: 'Constructive, kind, and specific feedback builds a supportive engineering culture without degrading morale.'
  },
  {
    id: 31,
    category: 'Handling Pressure',
    scenario: 'You made a typo in a configuration file that broke the dev server for 10 minutes. Your lead asks in the channel who touched it. What do you say?',
    options: [
      { id: 'A', text: '"It was me, I made a typo in the config. I have pushed the fix and verified the dev server is back up."' },
      { id: 'B', text: 'Stay silent and hope someone else takes the blame.' },
      { id: 'C', text: 'Blame Git for merging improperly.' },
      { id: 'D', text: 'Delete your commit history.' }
    ],
    correctOption: 'A',
    explanation: 'Immediate accountability paired with an active fix turns a mistake into a demonstration of trust.'
  },
  {
    id: 32,
    category: 'Tooling & Standards',
    scenario: 'Your project uses Prettier and ESLint. Your personal preference is tabs instead of spaces. What should you do?',
    options: [
      { id: 'A', text: 'Change the project .prettierrc file to match your personal preference.' },
      { id: 'B', text: 'Adhere to the shared project standards without altering the team linter.' },
      { id: 'C', text: 'Disable formatting before committing.' },
      { id: 'D', text: 'Argue in every meeting about tabs vs spaces.' }
    ],
    correctOption: 'B',
    explanation: 'Consistency across a shared codebase is far more important than individual formatting preferences.'
  },
  {
    id: 33,
    category: 'Feedback Solicitation',
    scenario: 'You are halfway through your 3-month internship. You have received little direct feedback. What should you do?',
    options: [
      { id: 'A', text: 'Assume everything is perfect and do nothing.' },
      { id: 'B', text: 'Ask your manager for a mid-point review: "What is one thing I am doing well, and one area where I can grow in the next 6 weeks?"' },
      { id: 'C', text: 'Assume you are about to be fired and panic.' },
      { id: 'D', text: 'Complain on Glassdoor anonymously.' }
    ],
    correctOption: 'B',
    explanation: 'Proactively soliciting growth feedback gives you actionable runway to improve before the final evaluation.'
  },
  {
    id: 34,
    category: 'Testing Mindset',
    scenario: 'You finished a feature and tested it on Chrome on your Mac. It works. Can you mark the ticket as Done?',
    options: [
      { id: 'A', text: 'Yes, if it works on one browser, it will work on all devices.' },
      { id: 'B', text: 'No, write unit tests, verify responsive viewports, test on Safari/Firefox/Mobile as required, and verify edge cases.' },
      { id: 'C', text: 'Let QA test it; developers shouldn’t test their own code.' },
      { id: 'D', text: 'Mark it done and deploy directly to production.' }
    ],
    correctOption: 'B',
    explanation: 'Engineering rigor involves verifying across platforms, edge cases, and automated test suites.'
  },
  {
    id: 35,
    category: 'Knowledge Sharing',
    scenario: 'You attended a tech conference funded by your company. How do you bring value back to your team?',
    options: [
      { id: 'A', text: 'Keep the knowledge to yourself so you stay ahead.' },
      { id: 'B', text: 'Prepare a 15-minute Lunch & Learn or write a short summary doc highlighting 3 takeaways applicable to your team.' },
      { id: 'C', text: 'Hand out free conference stickers and say nothing.' },
      { id: 'D', text: 'Tell everyone they should quit and work at the conference companies.' }
    ],
    correctOption: 'B',
    explanation: 'Sharing knowledge maximizes company ROI and establishes you as a thoughtful team contributor.'
  },
  {
    id: 36,
    category: 'Meeting Etiquette',
    scenario: 'You are joining a Zoom meeting with 15 engineers where you are not presenting. What is standard etiquette?',
    options: [
      { id: 'A', text: 'Leave your microphone unmuted with background noise playing.' },
      { id: 'B', text: 'Mute your microphone upon joining, pay attention, and unmute when you wish to contribute or speak.' },
      { id: 'C', text: 'Play loud music to entertain the room.' },
      { id: 'D', text: 'Join 15 minutes late without an apology.' }
    ],
    correctOption: 'B',
    explanation: 'Basic virtual meeting hygiene prevents audio interruptions and shows professional courtesy.'
  },
  {
    id: 37,
    category: 'Handling Rejection',
    scenario: 'You suggested a new framework for an upcoming project, but the senior leads decided to stick with the existing stack. How do you respond?',
    options: [
      { id: 'A', text: 'Pout and refuse to contribute to the project.' },
      { id: 'B', text: 'Understand the reasons (stability, team familiarity, migration costs) and commit fully to the chosen stack.' },
      { id: 'C', text: 'Secretly use your preferred framework anyway.' },
      { id: 'D', text: 'Send angry emails to the architecture committee.' }
    ],
    correctOption: 'B',
    explanation: '"Disagree and commit" is an essential engineering principle; team alignment supersedes personal preferences.'
  },
  {
    id: 38,
    category: 'Curiosity & Context',
    scenario: 'You are tasked with building an internal admin dashboard. How do you ensure it is actually useful?',
    options: [
      { id: 'A', text: 'Build whatever is quickest without asking who uses it.' },
      { id: 'B', text: 'Ask the operations/support team who will use it daily what their biggest workflow pain points are.' },
      { id: 'C', text: 'Add 20 animations and graphs that no one asked for.' },
      { id: 'D', text: 'Copy an unrelated dashboard from Dribbble.' }
    ],
    correctOption: 'B',
    explanation: 'Understanding the actual user persona and their pain points ensures engineering effort solves real problems.'
  },
  {
    id: 39,
    category: 'Work-Life Balance',
    scenario: 'You feel overwhelmed with university exams and your internship tasks in the same week. What should you do?',
    options: [
      { id: 'A', text: 'Disappear silently for 4 days.' },
      { id: 'B', text: 'Communicate with your manager ahead of time, request study leave or adjust your hours transparently.' },
      { id: 'C', text: 'Cheat on your exams to finish faster.' },
      { id: 'D', text: 'Submit plagiarized code to save time.' }
    ],
    correctOption: 'B',
    explanation: 'Early, transparent communication allows managers to adjust sprint capacity and prevent burnout.'
  },
  {
    id: 40,
    category: 'Gratitude & Team Spirit',
    scenario: 'On your last day of your internship, what is the best way to wrap up with your team?',
    options: [
      { id: 'A', text: 'Leave without saying goodbye to anyone.' },
      { id: 'B', text: 'Ensure all documentation and handovers are complete, and send a thoughtful thank-you note to mentors and collaborators.' },
      { id: 'C', text: 'Demand an immediate full-time job offer in the general channel.' },
      { id: 'D', text: 'Wipe all your local Git branches before pushing.' }
    ],
    correctOption: 'B',
    explanation: 'Professional handovers and expressing genuine gratitude leave lasting positive impressions and strong professional networks.'
  }
];
