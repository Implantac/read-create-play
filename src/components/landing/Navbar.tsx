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
          <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-2xl shadow-primary/10 group-hover:shadow-primary/20 group-hover:scale-105 transition-all duration-700 overflow-hidden border border-white/10 bg-black">
            <span className="text-xl font-black text-white italic tracking-tighter">UM</span>
          </div>
          <div className="flex flex-col">
            <span className="text-2xl font-black tracking-tighter uppercase italic leading-none">
              USE<span className="gradient-brand-text ml-0.5">MODA</span>
            </span>
            <span className="text-[9px] font-black tracking-[0.4em] uppercase opacity-40 mt-1">PLM AI • v2.0 Elite</span>
          </div>
        </Link>
        <div className="hidden lg:flex items-center gap-10">
          <Link to="/about" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-primary transition-all">
            Plataforma
          </Link>
          <Link to="/solutions" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-primary transition-all">
            Soluções
          </Link>
          <Link to="/login" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground transition-all">
            {t("common.login")}
          </Link>
          <Link to="/signup">
            <Button size="lg" variant="premium" className="h-12 px-10 text-[10px] font-black uppercase tracking-widest rounded-full">
              {t("landing.hero.cta_primary")} <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      </div>
    </nav>
  );
}
