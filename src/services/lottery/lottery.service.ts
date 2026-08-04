import { LotteryApi, DrawPrizeData, PrizeTierInfo, DrawResultWithPrizes } from "../api/lottery";

export type { PrizeTierInfo, DrawPrizeData, DrawResultWithPrizes };

/**
 * @deprecated Use LotteryApi from @/services/api/lottery
 */
export class LotteryService {
  static async fetchDraws(lotteryId: string, limitCount = 2000) {
    return LotteryApi.fetchDraws(lotteryId, limitCount);
  }

  static async syncLottery(lotteryId?: string, fullSync = false) {
    return LotteryApi.syncLottery(lotteryId, fullSync);
  }
}
