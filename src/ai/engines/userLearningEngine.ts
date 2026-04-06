/**
 * User Learning Engine — Aprende com os jogos do usuário e rankeia estratégias
 * Memória persistente por usuário + ranking de estratégias por performance
 */

import { supabase } from "@/integrations/supabase/client";

export interface UserMemoryEntry {
  lottery_id: string;
  memory_type: "preference" | "pattern" | "feedback" | "learning";
  key: string;
  value: Record<string, unknown>;
  confidence: number;
}

export interface StrategyPerformance {
  strategy: string;
  lottery_id: string;
  total_games: number;
  total_simulations: number;
  avg_score: number;
  avg_hits: number;
  best_hits: number;
  win_rate: number;
  consistency: number;
  last_used_at: string;
}

export interface UserLearningProfile {
  preferredStrategies: string[];
  avgScoreByStrategy: Record<string, number>;
  favoriteNumbers: number[];
  avoidedNumbers: number[];
  riskProfile: string;
  totalGamesGenerated: number;
  bestPerformingStrategy: string | null;
}

// ─── Memory CRUD ───────────────────────────────────

export async function getUserMemory(
  userId: string,
  lotteryId: string,
  memoryType?: string
): Promise<UserMemoryEntry[]> {
  let query = supabase
    .from("ai_user_memory")
    .select("lottery_id, memory_type, key, value, confidence")
    .eq("user_id", userId)
    .eq("lottery_id", lotteryId);

  if (memoryType) {
    query = query.eq("memory_type", memoryType);
  }

  const { data, error } = await query.order("updated_at", { ascending: false });
  if (error || !data) return [];
  return data as unknown as UserMemoryEntry[];
}

export async function upsertUserMemory(
  userId: string,
  entry: UserMemoryEntry
): Promise<void> {
  const record = {
    user_id: userId,
    lottery_id: entry.lottery_id,
    memory_type: entry.memory_type,
    key: entry.key,
    value: entry.value as unknown,
    confidence: entry.confidence,
    updated_at: new Date().toISOString(),
  };
  const { error } = await supabase
    .from("ai_user_memory")
    .upsert(record as any, { onConflict: "user_id,lottery_id,memory_type,key" });

  if (error) console.error("[UserLearning] upsert memory error:", error.message);
}

// ─── Strategy Performance ───────────────────────────

export async function getStrategyRanking(
  userId: string,
  lotteryId: string
): Promise<StrategyPerformance[]> {
  const { data, error } = await supabase
    .from("ai_strategy_performance")
    .select("*")
    .eq("user_id", userId)
    .eq("lottery_id", lotteryId)
    .order("avg_score", { ascending: false });

  if (error || !data) return [];
  return data as unknown as StrategyPerformance[];
}

export async function recordStrategyUsage(
  userId: string,
  lotteryId: string,
  strategy: string,
  score: number,
  hits: number
): Promise<void> {
  // Fetch existing record
  const { data: existing } = await supabase
    .from("ai_strategy_performance")
    .select("*")
    .eq("user_id", userId)
    .eq("lottery_id", lotteryId)
    .eq("strategy", strategy)
    .maybeSingle();

  if (existing) {
    const totalGames = (existing.total_games || 0) + 1;
    const newAvgScore = ((existing.avg_score || 0) * (existing.total_games || 0) + score) / totalGames;
    const newAvgHits = ((existing.avg_hits || 0) * (existing.total_games || 0) + hits) / totalGames;
    const bestHits = Math.max(existing.best_hits || 0, hits);

    await supabase
      .from("ai_strategy_performance")
      .upsert(
        {
          user_id: userId,
          lottery_id: lotteryId,
          strategy,
          total_games: totalGames,
          avg_score: Math.round(newAvgScore * 100) / 100,
          avg_hits: Math.round(newAvgHits * 100) / 100,
          best_hits: bestHits,
          last_used_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id,lottery_id,strategy" }
      );
  } else {
    await supabase.from("ai_strategy_performance").insert({
      user_id: userId,
      lottery_id: lotteryId,
      strategy,
      total_games: 1,
      avg_score: score,
      avg_hits: hits,
      best_hits: hits,
      last_used_at: new Date().toISOString(),
    });
  }
}

// ─── Learning from Saved Bets ───────────────────────

export async function learnFromSavedBets(
  userId: string,
  lotteryId: string
): Promise<UserLearningProfile> {
  // Fetch user's saved bets for this lottery
  const { data: bets } = await supabase
    .from("saved_bets")
    .select("numbers, score, grade, strategy")
    .eq("user_id", userId)
    .eq("lottery_id", lotteryId)
    .order("created_at", { ascending: false })
    .limit(200);

  const profile: UserLearningProfile = {
    preferredStrategies: [],
    avgScoreByStrategy: {},
    favoriteNumbers: [],
    avoidedNumbers: [],
    riskProfile: "balanced",
    totalGamesGenerated: bets?.length || 0,
    bestPerformingStrategy: null,
  };

  if (!bets || bets.length === 0) return profile;

  // Count strategy usage
  const strategyCounts: Record<string, { count: number; totalScore: number }> = {};
  const numberFrequency: Record<number, number> = {};

  for (const bet of bets) {
    const strat = bet.strategy || "manual";
    if (!strategyCounts[strat]) strategyCounts[strat] = { count: 0, totalScore: 0 };
    strategyCounts[strat].count++;
    strategyCounts[strat].totalScore += bet.score || 0;

    for (const n of bet.numbers) {
      numberFrequency[n] = (numberFrequency[n] || 0) + 1;
    }
  }

  // Preferred strategies (sorted by usage)
  profile.preferredStrategies = Object.entries(strategyCounts)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 5)
    .map(([s]) => s);

  // Avg score by strategy
  for (const [s, data] of Object.entries(strategyCounts)) {
    profile.avgScoreByStrategy[s] = Math.round((data.totalScore / data.count) * 100) / 100;
  }

  // Best performing strategy
  const bestStrat = Object.entries(profile.avgScoreByStrategy)
    .filter(([s]) => (strategyCounts[s]?.count || 0) >= 3)
    .sort((a, b) => b[1] - a[1])[0];
  profile.bestPerformingStrategy = bestStrat ? bestStrat[0] : profile.preferredStrategies[0] || null;

  // Favorite numbers (top 10 most used)
  const sortedNumbers = Object.entries(numberFrequency)
    .sort((a, b) => b[1] - a[1]);
  profile.favoriteNumbers = sortedNumbers.slice(0, 10).map(([n]) => Number(n));

  // Numbers the user rarely picks (bottom 10)
  profile.avoidedNumbers = sortedNumbers.slice(-10).map(([n]) => Number(n));

  // Determine risk profile from avg scores
  const avgScores = bets.map(b => b.score || 0).filter(s => s > 0);
  const overallAvg = avgScores.length > 0 ? avgScores.reduce((a, b) => a + b, 0) / avgScores.length : 50;

  if (overallAvg >= 75) profile.riskProfile = "conservative";
  else if (overallAvg >= 55) profile.riskProfile = "balanced";
  else profile.riskProfile = "aggressive";

  // Persist learnings
  await Promise.all([
    upsertUserMemory(userId, {
      lottery_id: lotteryId,
      memory_type: "learning",
      key: "favorite_numbers",
      value: { numbers: profile.favoriteNumbers },
      confidence: Math.min(0.9, bets.length / 50),
    }),
    upsertUserMemory(userId, {
      lottery_id: lotteryId,
      memory_type: "learning",
      key: "risk_profile",
      value: { profile: profile.riskProfile, avgScore: overallAvg },
      confidence: Math.min(0.9, bets.length / 30),
    }),
    upsertUserMemory(userId, {
      lottery_id: lotteryId,
      memory_type: "preference",
      key: "preferred_strategies",
      value: { strategies: profile.preferredStrategies },
      confidence: Math.min(0.9, bets.length / 20),
    }),
    upsertUserMemory(userId, {
      lottery_id: lotteryId,
      memory_type: "learning",
      key: "best_strategy",
      value: {
        strategy: profile.bestPerformingStrategy,
        avgScoreByStrategy: profile.avgScoreByStrategy,
      },
      confidence: bestStrat ? Math.min(0.9, (strategyCounts[bestStrat[0]]?.count || 0) / 10) : 0.3,
    }),
  ]);

  return profile;
}

// ─── Build Context for AI ───────────────────────────

export async function buildUserContext(
  userId: string,
  lotteryId: string
): Promise<string> {
  const [memories, ranking, profile] = await Promise.all([
    getUserMemory(userId, lotteryId),
    getStrategyRanking(userId, lotteryId),
    learnFromSavedBets(userId, lotteryId),
  ]);

  const parts: string[] = [];

  if (profile.totalGamesGenerated > 0) {
    parts.push(`PERFIL DO USUÁRIO (${profile.totalGamesGenerated} jogos salvos):`);
    parts.push(`- Perfil de risco: ${profile.riskProfile}`);
    if (profile.bestPerformingStrategy) {
      parts.push(`- Melhor estratégia: ${profile.bestPerformingStrategy}`);
    }
    if (profile.preferredStrategies.length > 0) {
      parts.push(`- Estratégias preferidas: ${profile.preferredStrategies.join(", ")}`);
    }
    if (profile.favoriteNumbers.length > 0) {
      parts.push(`- Números favoritos: ${profile.favoriteNumbers.join(", ")}`);
    }
  }

  if (ranking.length > 0) {
    parts.push("\nRANKING DE ESTRATÉGIAS DO USUÁRIO:");
    for (const r of ranking.slice(0, 5)) {
      parts.push(
        `- ${r.strategy}: score médio ${r.avg_score}, acertos médios ${r.avg_hits}, melhor ${r.best_hits}, ${r.total_games} jogos`
      );
    }
  }

  const learnings = memories.filter(m => m.memory_type === "learning");
  if (learnings.length > 0) {
    parts.push("\nAPRENDIZADOS DA IA:");
    for (const l of learnings.slice(0, 5)) {
      parts.push(`- ${l.key}: ${JSON.stringify(l.value)} (confiança: ${(l.confidence * 100).toFixed(0)}%)`);
    }
  }

  return parts.join("\n");
}
