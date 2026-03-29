import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";
import { loadFont } from "@remotion/google-fonts/SpaceGrotesk";
import { loadFont as loadMono } from "@remotion/google-fonts/JetBrainsMono";

const { fontFamily } = loadFont("normal", { weights: ["400", "600", "700"], subsets: ["latin"] });
const { fontFamily: monoFamily } = loadMono("normal", { weights: ["400", "600", "700"], subsets: ["latin"] });

const cardData = [
  { label: "Sorteios", value: "10.247", color: "#22c55e" },
  { label: "Padrões IA", value: "847", color: "#0ea5e9" },
  { label: "Win Rate", value: "71%", color: "#22c55e" },
  { label: "Score", value: "A+", color: "#eab308" },
];

const barHeights = [65, 42, 78, 35, 90, 55, 70, 48, 82, 60, 45, 73, 88, 51, 67, 40];

export const SceneDashboard: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleOp = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp" });
  const titleY = interpolate(spring({ frame, fps, config: { damping: 20 } }), [0, 1], [40, 0]);

  return (
    <AbsoluteFill style={{ fontFamily, padding: 80 }}>
      {/* Section label */}
      <div
        style={{
          fontSize: 14,
          fontFamily: monoFamily,
          color: "#22c55e",
          textTransform: "uppercase",
          letterSpacing: 3,
          marginBottom: 12,
          opacity: titleOp,
        }}
      >
        ● Dashboard Inteligente
      </div>

      <h2
        style={{
          fontSize: 56,
          fontWeight: 700,
          color: "#f0f2f5",
          opacity: titleOp,
          transform: `translateY(${titleY}px)`,
          marginBottom: 50,
        }}
      >
        Visão completa em{" "}
        <span style={{ background: "linear-gradient(90deg, #22c55e, #0ea5e9)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
          tempo real
        </span>
      </h2>

      {/* Stats cards */}
      <div style={{ display: "flex", gap: 24, marginBottom: 40 }}>
        {cardData.map((card, i) => {
          const s = spring({ frame: frame - 10 - i * 5, fps, config: { damping: 15, stiffness: 120 } });
          return (
            <div
              key={card.label}
              style={{
                flex: 1,
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 16,
                padding: "28px 24px",
                transform: `scale(${s}) translateY(${interpolate(s, [0, 1], [20, 0])}px)`,
                opacity: s,
              }}
            >
              <div style={{ fontSize: 42, fontWeight: 700, fontFamily: monoFamily, color: card.color }}>
                {card.value}
              </div>
              <div style={{ fontSize: 14, color: "rgba(240,242,245,0.5)", marginTop: 4, textTransform: "uppercase", letterSpacing: 1 }}>
                {card.label}
              </div>
            </div>
          );
        })}
      </div>

      {/* Bar chart */}
      <div
        style={{
          background: "rgba(255,255,255,0.02)",
          border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: 16,
          padding: 32,
          height: 300,
        }}
      >
        <div style={{ fontSize: 12, fontFamily: monoFamily, color: "rgba(240,242,245,0.4)", textTransform: "uppercase", letterSpacing: 2, marginBottom: 20 }}>
          Frequência dos Números
        </div>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 220 }}>
          {barHeights.map((h, i) => {
            const barProgress = interpolate(frame, [20 + i * 2, 40 + i * 2], [0, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });
            return (
              <div
                key={i}
                style={{
                  flex: 1,
                  height: `${h * barProgress}%`,
                  borderRadius: "6px 6px 0 0",
                  background: `linear-gradient(to top, rgba(34, 197, 94, 0.8), rgba(34, 197, 94, 0.2))`,
                }}
              />
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};
