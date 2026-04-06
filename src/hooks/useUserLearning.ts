/**
 * Hook para integração do motor de aprendizado da IA com componentes React
 */

import { useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  learnFromSavedBets,
  getStrategyRanking,
  recordStrategyUsage,
  buildUserContext,
  type UserLearningProfile,
  type StrategyPerformance,
} from "@/ai/engines/userLearningEngine";

export function useUserLearning(lotteryId: string) {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserLearningProfile | null>(null);
  const [ranking, setRanking] = useState<StrategyPerformance[]>([]);
  const [userContext, setUserContext] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const [p, r, ctx] = await Promise.all([
        learnFromSavedBets(user.id, lotteryId),
        getStrategyRanking(user.id, lotteryId),
        buildUserContext(user.id, lotteryId),
      ]);
      setProfile(p);
      setRanking(r);
      setUserContext(ctx);
    } catch (e) {
      console.error("[useUserLearning] error:", e);
    } finally {
      setLoading(false);
    }
  }, [user?.id, lotteryId]);

  const trackStrategy = useCallback(
    async (strategy: string, score: number, hits: number) => {
      if (!user?.id) return;
      await recordStrategyUsage(user.id, lotteryId, strategy, score, hits);
    },
    [user?.id, lotteryId]
  );

  return { profile, ranking, userContext, loading, refresh, trackStrategy };
}
