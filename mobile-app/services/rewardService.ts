import { addPoints, getUniqueCompletionsCount, isMeditationCompleted, saveHistory, getProgress } from './db';

export interface RewardResult {
  pointsEarned: number;
  isMilestone: boolean;
  milestoneValue?: number;
  isNewUnique: boolean;
  currentPoints: number;
  currentStars: number;
}

export const processMeditationCompletion = async (
  meditationId: string,
  title: string
): Promise<RewardResult | null> => {
  try {
    // 1. Check if it's already completed (unique)
    const alreadyCompleted = await isMeditationCompleted(meditationId);
    
    // Always save history, but we only care about first-time completion for rewards
    await saveHistory(meditationId, title, true);

    if (alreadyCompleted) {
      console.log(`[Reward] Meditation ${meditationId} already completed. No points awarded.`);
      return {
        pointsEarned: 0,
        isMilestone: false,
        isNewUnique: false
      };
    }

    // 2. It's a new unique completion!
    const uniqueCount = await getUniqueCompletionsCount();
    let pointsToAward = 10; // Base points for unique completion
    let isMilestone = false;
    let milestoneValue = undefined;

    if (uniqueCount === 1) {
      pointsToAward = 20; // First meditation reward
      isMilestone = true;
      milestoneValue = 1;
    } else if (uniqueCount === 10) {
      pointsToAward = 50;
      isMilestone = true;
      milestoneValue = 10;
    } else if (uniqueCount === 50) {
      pointsToAward = 100;
      isMilestone = true;
      milestoneValue = 50;
    } else if (uniqueCount === 100) {
      pointsToAward = 200;
      isMilestone = true;
      milestoneValue = 100;
    }

    let resultPoints = 0;
    let resultStars = 0;

    if (pointsToAward > 0) {
      const stats = await addPoints(pointsToAward);
      resultPoints = stats.points;
      resultStars = stats.stars;
    } else {
      const progress = await getProgress();
      resultPoints = progress.points;
      resultStars = progress.stars;
    }

    return {
      pointsEarned: pointsToAward,
      isMilestone,
      milestoneValue,
      isNewUnique: true,
      currentPoints: resultPoints,
      currentStars: resultStars
    };
  } catch (error) {
    console.error('[Reward] Error processing completion:', error);
    return null;
  }
};
