import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { Ghost, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.warn("[Titan] 404 — route not found:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background gradient-mesh px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-6"
      >
        <div className="w-20 h-20 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto">
          <Ghost className="w-10 h-10 text-primary" />
        </div>
        <div>
          <h1 className="text-6xl font-bold gradient-brand-text font-display">404</h1>
          <p className="text-lg text-muted-foreground mt-2">Página não encontrada</p>
          <p className="text-sm text-muted-foreground/60 mt-1 font-mono">{location.pathname}</p>
        </div>
        <Link to="/">
          <Button className="gap-2 gradient-brand text-primary-foreground shadow-lg shadow-primary/20">
            <ArrowLeft className="w-4 h-4" />
            Voltar ao início
          </Button>
        </Link>
      </motion.div>
    </div>
  );
};

export default NotFound;
