import fs from 'fs';
import path from 'path';

const mapping = {
  // Generators
  'BetGenerator': '@/components/lottery/generators/BetGenerator',
  'EnhancedBetGenerator': '@/components/lottery/generators/EnhancedBetGenerator',
  'ExtremeGeneratorPanel': '@/components/lottery/generators/ExtremeGeneratorPanel',
  'IntelligentGeneratorPanel': '@/components/lottery/generators/IntelligentGeneratorPanel',
  'ProfessionalGeneratorPanel': '@/components/lottery/generators/ProfessionalGeneratorPanel',
  'SmartUnfoldingGenerator': '@/components/lottery/generators/SmartUnfoldingGenerator',
  'GeneratorFiltersPanel': '@/components/lottery/generators/GeneratorFiltersPanel',
  'ExtremeComparisonPanel': '@/components/lottery/generators/ExtremeComparisonPanel',
  'EvolutiveGeneratorPanel': '@/components/lottery/generators/EvolutiveGeneratorPanel',
  
  // Analysis
  'GameAnalysisBlock': '@/components/lottery/analysis/GameAnalysisBlock',
  'AdvancedAnalyticsPanel': '@/components/lottery/analysis/AdvancedAnalyticsPanel',
  'FarolDezenas': '@/components/lottery/analysis/FarolDezenas',
  'FarolEstatistico': '@/components/lottery/analysis/FarolEstatistico',
  'HeatmapGrid': '@/components/lottery/analysis/HeatmapGrid',
  'HeatmapInteligente': '@/components/lottery/analysis/HeatmapInteligente',
  'MLPanel': '@/components/lottery/analysis/MLPanel',
  'PatternDetectorPanel': '@/components/lottery/analysis/PatternDetectorPanel',
  'PrizeHistoryPanel': '@/components/lottery/analysis/PrizeHistoryPanel',
  'StrategyBriefingPanel': '@/components/lottery/analysis/StrategyBriefingPanel',
  'TechnicalIndicators': '@/components/lottery/analysis/TechnicalIndicators',
  'BetChecker': '@/components/lottery/analysis/BetChecker',
  'MatrizAnaliseTable': '@/components/lottery/analysis/MatrizAnaliseTable',
  'MatrixComparisonPanel': '@/components/lottery/analysis/MatrixComparisonPanel',
  'RobustnessRadarPanel': '@/components/lottery/analysis/RobustnessRadarPanel',
  'SystemAuditStatus': '@/components/lottery/analysis/SystemAuditStatus',
  'TitanHealthGauge': '@/components/lottery/analysis/TitanHealthGauge',
  
  // Charts
  'BetHitsChart': '@/components/lottery/charts/BetHitsChart',
  'ConsecutiveChart': '@/components/lottery/charts/ConsecutiveChart',
  'DelayChart': '@/components/lottery/charts/DelayChart',
  'FrequencyChart': '@/components/lottery/charts/FrequencyChart',
  'ParityChart': '@/components/lottery/charts/ParityChart',
  'SumChart': '@/components/lottery/charts/SumChart',
  'RangeDistribution': '@/components/lottery/charts/RangeDistribution',
  
  // Simulators
  'GameSimulator': '@/components/lottery/simulators/GameSimulator',
  'HistoricalSimulatorPanel': '@/components/lottery/simulators/HistoricalSimulatorPanel',
  'IntelligentSimulatorPanel': '@/components/lottery/simulators/IntelligentSimulatorPanel',
  'InvestmentSimulator': '@/components/lottery/simulators/InvestmentSimulator',
  'MassiveSimulatorPanel': '@/components/lottery/simulators/MassiveSimulatorPanel',
  'StrategySimulatorPanel': '@/components/lottery/simulators/StrategySimulatorPanel',
  'WinningsSimulator': '@/components/lottery/simulators/WinningsSimulator',
  'ComparativeSimulatorPanel': '@/components/lottery/simulators/ComparativeSimulatorPanel',
  'MassiveSimulationDashboard': '@/components/lottery/simulators/MassiveSimulationDashboard',
  'StrategyComparatorPanel': '@/components/lottery/simulators/StrategyComparatorPanel',
  
  // General Lottery
  'LotterySelector': '@/components/lottery/LotterySelector',
  'LotteryLogosCarousel': '@/components/lottery/LotteryLogosCarousel',
  'FloatingLotteryBalls': '@/components/lottery/FloatingLotteryBalls',
  'RecentDraws': '@/components/lottery/RecentDraws',
  'AchievementDisplay': '@/components/lottery/AchievementDisplay',
  'DrawNotificationChecker': '@/components/lottery/DrawNotificationChecker',
  'HistoricalValidationBadge': '@/components/lottery/HistoricalValidationBadge',
  'SavedBetsPanel': '@/components/lottery/SavedBetsPanel',
  'TitanScoreBadge': '@/components/lottery/TitanScoreBadge',
  
  // Common
  'AnimatedCounter': '@/components/common/AnimatedCounter',
  'FloatingCTA': '@/components/common/FloatingCTA',
  'WhatsAppButton': '@/components/common/WhatsAppButton',
  'SocialProofBar': '@/components/common/SocialProofBar',
  'Testimonials': '@/components/common/Testimonials',
  'ThemeToggle': '@/components/common/ThemeToggle',
  'ComplianceDisclaimer': '@/components/common/ComplianceDisclaimer',
  'NotificationsPanel': '@/components/common/NotificationsPanel',
  'AutoUpdater': '@/components/common/AutoUpdater',
  'ScreensShowcase': '@/components/common/ScreensShowcase',
  'PricingSection': '@/components/common/PricingSection',
  'TitanCommandCenter': '@/components/common/TitanCommandCenter',
  
  // Layout
  'PageHeader': '@/components/layout/PageHeader',
};

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

walkDir('src', (filePath) => {
  if (!filePath.endsWith('.tsx') && !filePath.endsWith('.ts')) return;
  
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;
  
  Object.entries(mapping).forEach(([name, newPath]) => {
    // Match import { ... } from "@/components/Name"
    const regexFrom = new RegExp(`from ["']@/components/${name}["']`, 'g');
    if (regexFrom.test(content)) {
      content = content.replace(regexFrom, `from "${newPath}"`);
      changed = true;
    }
    
    // Match import("@/components/Name")
    const regexImport = new RegExp(`import\\(["']@/components/${name}["']\\)`, 'g');
    if (regexImport.test(content)) {
      content = content.replace(regexImport, `import("${newPath}")`);
      changed = true;
    }
  });
  
  if (changed) {
    fs.writeFileSync(filePath, content);
    console.log(`Updated imports in ${filePath}`);
  }
});
