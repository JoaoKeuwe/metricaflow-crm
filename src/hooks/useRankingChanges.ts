import { useEffect, useRef, useState } from 'react';

export interface RankingChange {
  userId: string;
  oldPosition: number;
  newPosition: number;
  direction: 'up' | 'down' | 'same';
}

export function useRankingChanges(leaderboard: any[]) {
  const previousRanking = useRef<Map<string, number>>(new Map());
  const [changes, setChanges] = useState<RankingChange[]>([]);

  useEffect(() => {
    if (!leaderboard || leaderboard.length === 0) return;

    const newChanges: RankingChange[] = [];

    leaderboard.forEach((user, newIndex) => {
      const userId = user.userId;
      const oldPosition = previousRanking.current.get(userId);

      if (oldPosition !== undefined && oldPosition !== newIndex) {
        newChanges.push({
          userId,
          oldPosition,
          newPosition: newIndex,
          direction: newIndex < oldPosition ? 'up' : 'down',
        });
      }
    });

    if (newChanges.length > 0) {
      setChanges(newChanges);
      
      // Clear changes after animation
      setTimeout(() => setChanges([]), 2000);
    }

    // Update previous ranking
    const newMap = new Map<string, number>();
    leaderboard.forEach((user, index) => {
      newMap.set(user.userId, index);
    });
    previousRanking.current = newMap;
  }, [leaderboard]);

  return changes;
}
