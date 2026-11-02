// Generic, fictional data for task.seed, so the list, pagination and infinite
// scroll can be tried without typing fifty tasks by hand.
const VERBS = [
  "Review",
  "Update",
  "Fix",
  "Write",
  "Plan",
  "Schedule",
  "Refactor",
  "Draft",
  "Test",
  "Deploy",
];
const SUBJECTS = [
  "the onboarding flow",
  "the billing report",
  "the API docs",
  "the search page",
  "the weekly newsletter",
];
const NOTES = [
  "Check with the team before starting.",
  "Needs a quick review once it is done.",
  "Low priority, nice to have this week.",
  "Blocked until the design is approved.",
  "Should take about an hour.",
  "Follow up on Friday.",
];

// VERBS x SUBJECTS = 50 distinct titles, numbered so the order is easy to check.
export function sampleTasks(): { titulo: string; descricao?: string }[] {
  return Array.from({ length: VERBS.length * SUBJECTS.length }, (_, index) => {
    const number = index + 1;
    const verb = VERBS[index % VERBS.length];
    const subject = SUBJECTS[Math.floor(index / VERBS.length)];
    return {
      titulo: `#${String(number).padStart(2, "0")} ${verb} ${subject}`,
      // One in three has no description, so both layouts show up.
      descricao: number % 3 === 0 ? undefined : NOTES[number % NOTES.length],
    };
  });
}
