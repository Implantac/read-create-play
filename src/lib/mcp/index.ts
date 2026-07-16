import { auth, defineMcp } from "@lovable.dev/mcp-js";
import listRecentDraws from "./tools/list-recent-draws";
import topNumbers from "./tools/top-numbers";
import listSavedBets from "./tools/list-saved-bets";

const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "titan-loterias-mcp",
  title: "Titan Loterias",
  version: "0.1.0",
  instructions:
    "Ferramentas do Titan Loterias: consulte sorteios oficiais recentes, dezenas mais frequentes e as apostas salvas do usuário autenticado.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [listRecentDraws, topNumbers, listSavedBets],
});
