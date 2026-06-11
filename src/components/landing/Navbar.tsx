import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export function Navbar() {
  const { t } = useTranslation();

  return (
    <nav className="fixed top-0 inset-x-0 z-50 bg-background/80 backdrop-blur-xl border-b border-white/5 h-20 md:h-24 flex items-center">
      <div className="container mx-auto px-6 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-4 group">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-2xl shadow-primary/20 group-hover:shadow-primary/40 group-hover:scale-110 transition-all duration-700 overflow-hidden border border-white/10 bg-background/50">
            <img src="/logo.png" alt="Titan Loterias" className="w-14 h-14 object-contain" />
          </div>
          <div className="flex flex-col">
            <span className="text-2xl font-black tracking-tighter uppercase italic leading-none">
              Titan<span className="gradient-brand-text ml-0.5">Loterias</span>
            </span>
            <span className="text-[10px] font-black tracking-[0.3em] uppercase opacity-40 mt-1">Neural Core v7.5 Alpha</span>
          </div>
        </Link>
        <div className="hidden lg:flex items-center gap-10">
          <Link to="/signup" className="text-xs font-black uppercase tracking-widest text-neon-amber hover:text-neon-amber/80 transition-all">
            {t("common.vital_access")}
          </Link>
          <Link to="/login" className="text-xs font-black uppercase tracking-widest text-muted-foreground hover:text-foreground transition-all">
            {t("common.login")}
          </Link>
          <Link to="/signup">
            <Button size="lg" variant="premium" className="h-12 px-10">
              {t("common.join_network")} <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      </div>
    </nav>
  );
}
