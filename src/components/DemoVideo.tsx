import { motion } from "framer-motion";
import { useRef, useState, useCallback, useEffect } from "react";
import { Play, Pause, Volume2, VolumeX } from "lucide-react";
import { createAmbientTrack } from "@/lib/ambient-audio";

export function DemoVideo() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const ambientRef = useRef<ReturnType<typeof createAmbientTrack> | null>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      ambientRef.current?.stop();
      audioCtxRef.current?.close();
    };
  }, []);

  const ensureAudio = useCallback(() => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new AudioContext();
      ambientRef.current = createAmbientTrack(audioCtxRef.current);
    }
  }, []);

  const togglePlay = useCallback(() => {
    if (!videoRef.current) return;
    ensureAudio();

    if (videoRef.current.paused) {
      videoRef.current.play();
      if (audioCtxRef.current?.state === "suspended") {
        audioCtxRef.current.resume();
      }
      ambientRef.current?.start();
      if (!muted) ambientRef.current?.setVolume(1);
      setPlaying(true);
    } else {
      videoRef.current.pause();
      ambientRef.current?.stop();
      setPlaying(false);
    }
  }, [ensureAudio, muted]);

  const toggleMute = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setMuted((prev) => {
      const next = !prev;
      ambientRef.current?.setVolume(next ? 0 : 1);
      return next;
    });
  }, []);

  const handleVideoEnd = useCallback(() => {
    // Loop — video has loop attr, but restart audio cycle
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
          <div className="flex items-center justify-between px-4 py-2.5 bg-card/80 border-b border-border/20">
            <div className="flex items-center gap-2">
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-neon-red/50" />
                <div className="w-2.5 h-2.5 rounded-full bg-accent/50" />
                <div className="w-2.5 h-2.5 rounded-full bg-primary/50" />
              </div>
              <span className="text-[10px] font-mono text-muted-foreground/50 ml-2">
                titan-loterias.com
              </span>
            </div>
            {/* Mute toggle - only show when playing */}
            {playing && (
              <button
                onClick={toggleMute}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-muted/30 hover:bg-muted/50 transition-colors text-muted-foreground hover:text-foreground z-10"
              >
                {muted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                <span className="text-[10px] font-mono">{muted ? "Som off" : "Som on"}</span>
              </button>
            )}
          </div>

          <video
            ref={videoRef}
            src="/titan-demo.mp4"
            className="w-full aspect-video bg-background"
            muted
            playsInline
            loop
            onEnded={handleVideoEnd}
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

          {/* Pause overlay on hover when playing */}
          {playing && (
            <div className="absolute inset-0 top-[36px] flex items-center justify-center bg-background/0 hover:bg-background/20 transition-colors opacity-0 hover:opacity-100">
              <Pause className="w-12 h-12 text-foreground/70" />
            </div>
          )}
        </motion.div>

        {/* Audio hint */}
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center text-xs text-muted-foreground/50 mt-4 flex items-center justify-center gap-1.5"
        >
          <Volume2 className="w-3 h-3" />
          Clique para assistir com trilha sonora ambiente
        </motion.p>
      </div>
    </section>
  );
}
