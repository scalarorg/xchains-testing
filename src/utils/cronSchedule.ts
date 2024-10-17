let currentStakingSchedule = "0 * * * *"; // Default to every hour
let currentUnstakingSchedule = "0 * * * *"; // Default to every hour

export function setCurrentStakingSchedule(schedule: string) {
  currentStakingSchedule = schedule;
}

export function getCurrentStakingSchedule(): string {
  return currentStakingSchedule;
}

export function setCurrentUnstakingSchedule(schedule: string) {
  currentUnstakingSchedule = schedule;
}

export function getCurrentUnstakingSchedule(): string {
  return currentUnstakingSchedule;
}
