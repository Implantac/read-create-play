import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { useEffect, useCallback } from "react";

const prefetchLogin = () => import("@/pages/LoginPage");
const prefetchSignup = () => import("@/pages/SignupPage");

export function Navbar() {
  const { t } = useTranslation();

  useEffect(() => {
    const idle = (cb: () => void) => {
      const w = window as unknown as { requestIdleCallback?: (cb: () => void) => number };
      if (typeof w.requestIdleCallback === "function") w.requestIdleCallback(cb);
      else setTimeout(cb, 1500);
    };
    idle(() => { prefetchLogin(); prefetchSignup(); });
  }, []);

  const onHoverLogin = useCallback(() => { prefetchLogin(); }, []);
  const onHoverSignup = useCallback(() => { prefetchSignup(); }, []);

  return (
    <nav className="fixed top-0 inset-x-0 z-50 bg-background/60 backdrop-blur-2xl border-b border-white/5 h-20 md:h-24 flex items-center transition-all">
      <div className="container mx-auto px-6 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-4 group">
          <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center shadow-2xl shadow-primary/20 group-hover:shadow-primary/40 group-hover:scale-105 transition-all duration-700 overflow-hidden border border-white/10 bg-background/50">
            <img src="/logo.png" alt="Titan Loterias" className="w-10 h-10 md:w-12 md:h-12 object-contain" />
          </div>
          <div className="flex flex-col">
            <span className="text-xl md:text-2xl font-black tracking-tighter uppercase italic leading-none">
              Titan<span className="gradient-brand-text ml-0.5">Loterias</span>
            </span>
            <span className="text-[9px] md:text-[10px] font-black tracking-[0.3em] uppercase opacity-40 mt-1 italic">Neural Core v7.5 Alpha</span>
          </div>
        </Link>
        <div className="hidden lg:flex items-center gap-10">
          <Link to="/signup" onMouseEnter={onHoverSignup} onFocus={onHoverSignup} className="text-xs font-black uppercase tracking-widest text-neon-amber hover:text-neon-amber/80 transition-all">
            {t("common.vital_access")}
          </Link>
          <Link to="/login" onMouseEnter={onHoverLogin} onFocus={onHoverLogin} className="text-xs font-black uppercase tracking-widest text-muted-foreground hover:text-foreground transition-all">
            {t("common.login")}
          </Link>
          <Link to="/signup" onMouseEnter={onHoverSignup} onFocus={onHoverSignup}>
            <Button size="lg" variant="premium" className="h-12 px-10">
              {t("common.join_network")} <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      </div>
    </nav>
  );
}
