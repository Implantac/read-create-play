import { motion } from "framer-motion";
import { useRef, useState, useCallback } from "react";
import { Play, Pause } from "lucide-react";

export function DemoVideo() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);

  const togglePlay = useCallback(() => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
      setPlaying(true);
    } else {
      videoRef.current.pause();
      setPlaying(false);
    }
  }, []);

  return (
    <section className="py-16 md:py-24">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-10"
        >
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">
            Veja o Titan em{" "}
            <span className="gradient-brand-text">ação</span>
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            20 segundos para entender como a IA transforma suas apostas.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="max-w-4xl mx-auto relative rounded-2xl overflow-hidden border border-border/30 shadow-2xl shadow-primary/5 group cursor-pointer"
          onClick={togglePlay}
        >
          {/* Browser chrome */}
          <div className="flex items-center gap-2 px-4 py-2.5 bg-card/80 border-b border-border/20">
            <div className="flex gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-neon-red/50" />
              <div className="w-2.5 h-2.5 rounded-full bg-accent/50" />
              <div className="w-2.5 h-2.5 rounded-full bg-primary/50" />
            </div>
            <span className="text-[10px] font-mono text-muted-foreground/50 ml-2">
              titan-loterias.com
            </span>
          </div>

          <video
            ref={videoRef}
            src="/titan-demo.mp4"
            className="w-full aspect-video bg-background"
            muted
            playsInline
            loop
            onEnded={() => setPlaying(false)}
          />

          {/* Play overlay */}
          {!playing && (
            <div className="absolute inset-0 top-[36px] flex items-center justify-center bg-background/30">
              <motion.div
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className="w-20 h-20 rounded-full gradient-brand flex items-center justify-center shadow-2xl shadow-primary/30"
              >
                <Play className="w-8 h-8 text-primary-foreground ml-1" />
              </motion.div>
            </div>
          )}
        </motion.div>
      </div>
    </section>
  );
}
