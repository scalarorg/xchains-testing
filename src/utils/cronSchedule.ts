let currentSchedule = "0 * * * *"; // Default to every hour

export function setCurrentSchedule(schedule: string) {
  currentSchedule = schedule;
}

export function getCurrentSchedule(): string {
  return currentSchedule;
}
