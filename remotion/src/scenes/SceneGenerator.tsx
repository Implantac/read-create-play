import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";
import { loadFont } from "@remotion/google-fonts/SpaceGrotesk";
import { loadFont as loadMono } from "@remotion/google-fonts/JetBrainsMono";

const { fontFamily } = loadFont("normal", { weights: ["400", "600", "700"], subsets: ["latin"] });
const { fontFamily: monoFamily } = loadMono("normal", { weights: ["400", "600", "700"], subsets: ["latin"] });

const numbers = [
  { n: "07", delay: 20 },
  { n: "13", delay: 25 },
  { n: "22", delay: 30 },
  { n: "34", delay: 35 },
  { n: "41", delay: 40 },
  { n: "58", delay: 45 },
];

export const SceneGenerator: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleOp = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp" });
  const titleY = interpolate(spring({ frame, fps, config: { damping: 20 } }), [0, 1], [40, 0]);

  return (
    <AbsoluteFill style={{ fontFamily, padding: 80, justifyContent: "center" }}>
      <div style={{ textAlign: "center" }}>
        <div
          style={{
            fontSize: 14,
            fontFamily: monoFamily,
            color: "#0ea5e9",
            textTransform: "uppercase",
            letterSpacing: 3,
            marginBottom: 12,
            opacity: titleOp,
          }}
        >
          ● Gerador com IA
        </div>

        <h2
          style={{
            fontSize: 56,
            fontWeight: 700,
            color: "#f0f2f5",
            opacity: titleOp,
            transform: `translateY(${titleY}px)`,
            marginBottom: 16,
          }}
        >
          Apostas geradas por{" "}
          <span style={{ background: "linear-gradient(90deg, #22c55e, #0ea5e9)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            algoritmos avançados
          </span>
        </h2>

        <p style={{ fontSize: 22, color: "rgba(240,242,245,0.5)", marginBottom: 60, opacity: titleOp }}>
          Mega-Sena — Aposta Otimizada
        </p>

        {/* Lottery balls */}
        <div style={{ display: "flex", justifyContent: "center", gap: 32, marginBottom: 50 }}>
          {numbers.map((ball) => {
            const s = spring({ frame: frame - ball.delay, fps, config: { damping: 10, stiffness: 150 } });
            const glow = interpolate(frame, [ball.delay + 15, ball.delay + 30], [0, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });
            return (
              <div
                key={ball.n}
                style={{
                  width: 120,
                  height: 120,
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, #22c55e, #0ea5e9)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 44,
                  fontWeight: 700,
                  fontFamily: monoFamily,
                  color: "#0a0e14",
                  transform: `scale(${s})`,
                  boxShadow: `0 0 ${40 * glow}px rgba(34, 197, 94, ${0.4 * glow})`,
                }}
              >
                {ball.n}
              </div>
            );
          })}
        </div>

        {/* Score badge */}
        {(() => {
          const badgeOp = interpolate(frame, [55, 70], [0, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });
          const badgeS = spring({ frame: frame - 55, fps, config: { damping: 12 } });
          return (
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 12,
                padding: "16px 32px",
                borderRadius: 50,
                background: "rgba(34, 197, 94, 0.1)",
                border: "1px solid rgba(34, 197, 94, 0.2)",
                opacity: badgeOp,
                transform: `scale(${badgeS})`,
              }}
            >
              <span style={{ fontSize: 18, fontFamily: monoFamily, color: "#22c55e", fontWeight: 700 }}>
                Score: 94/100
              </span>
              <span style={{ fontSize: 18, fontFamily: monoFamily, color: "#eab308", fontWeight: 700 }}>
                Grau A+
              </span>
            </div>
          );
        })()}
      </div>
    </AbsoluteFill>
  );
};
