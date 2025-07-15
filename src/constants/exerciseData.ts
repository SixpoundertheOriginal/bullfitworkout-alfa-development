
/**
 * Standardized data for sample exercise histories and helpers for prior sessions.
 */

export const exerciseHistoryData = {
  "Bench Press": [
    { date: "Apr 10", weight: 135, reps: 10, sets: 3 },
    { date: "Apr 3", weight: 130, reps: 10, sets: 3 },
    { date: "Mar 27", weight: 125, reps: 8, sets: 3 },
  ],
  "Squats": [
    { date: "Apr 9", weight: 185, reps: 8, sets: 3 },
    { date: "Apr 2", weight: 175, reps: 8, sets: 3 },
    { date: "Mar 26", weight: 165, reps: 8, sets: 3 },
  ],
  "Deadlift": [
    { date: "Apr 8", weight: 225, reps: 5, sets: 3 },
    { date: "Apr 1", weight: 215, reps: 5, sets: 3 },
    { date: "Mar 25", weight: 205, reps: 5, sets: 3 },
  ],
  "Pull-ups": [
    { date: "Apr 7", weight: 0, reps: 8, sets: 3 },
    { date: "Mar 31", weight: 0, reps: 7, sets: 3 },
    { date: "Mar 24", weight: 0, reps: 6, sets: 3 },
  ],
};

export const getPreviousSessionData = (exerciseName: string) => {
  const history = exerciseHistoryData[exerciseName] || [];
  if (history.length > 0) {
    return history[0];
  }
  return { date: "N/A", weight: 0, reps: 0, sets: 0 };
};

export const popularExercises = [
  "Bench Press",
  "Squats",
  "Deadlift",
  "Pull-ups",
  "Push-ups",
  "Shoulder Press",
  "Decline Push-Up on Handrails"
];
