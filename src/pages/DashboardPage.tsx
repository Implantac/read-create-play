import { useState } from "react";
import { useLotteryContext } from "@/contexts/LotteryContext";
import { useBetGenerator } from "@/hooks/logic/useBetGenerator";
import { AnimatePresence } from "framer-motion";
import { AIAnalystBriefing } from "@/components/lottery/AIAnalystBriefing";
import { TitanCommandCenter } from "@/components/common/TitanCommandCenter";
import { DashboardHeader } from "@/components/layout/dashboard/DashboardHeader";
import { RecommendationCard } from "@/components/lottery/RecommendationCard";
import { QuickStatsRow } from "@/components/lottery/QuickStatsRow";

const DashboardPage = () => {
  const { stats, draws } = useLotteryContext();
  const { luckyGame, generating, generateGame } = useBetGenerator();
  const [showBriefing, setShowBriefing] = useState(false);

  return (
    <div className="space-y-12 animate-in fade-in duration-700 max-w-7xl mx-auto px-4 sm:px-6">
      <DashboardHeader statsCount={stats.length} drawsCount={draws.length} />

      <RecommendationCard 
        luckyGame={luckyGame} 
        generating={generating} 
        onGenerate={generateGame} 
        onShowBriefing={() => setShowBriefing(true)} 
      />

      <QuickStatsRow drawsCount={draws.length} />

      <TitanCommandCenter />

      <AnimatePresence>
        {showBriefing && luckyGame && (
          <AIAnalystBriefing
            game={luckyGame.numbers}
            score={luckyGame.score}
            strategy={luckyGame.strategy}
            reasons={luckyGame.reasons}
            onClose={() => setShowBriefing(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default DashboardPage;
