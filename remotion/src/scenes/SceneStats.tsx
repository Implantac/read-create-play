import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";
import { loadFont } from "@remotion/google-fonts/SpaceGrotesk";
import { loadFont as loadMono } from "@remotion/google-fonts/JetBrainsMono";

const { fontFamily } = loadFont("normal", { weights: ["400", "600", "700"], subsets: ["latin"] });
const { fontFamily: monoFamily } = loadMono("normal", { weights: ["400", "600", "700"], subsets: ["latin"] });

export const SceneStats: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleOp = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp" });

  // Generate heatmap cells
  const cells = Array.from({ length: 60 }, (_, i) => ({
    num: i + 1,
    intensity: Math.sin(i * 0.7 + 2) * 0.35 + 0.5,
  }));

  return (
    <AbsoluteFill style={{ fontFamily, padding: 80 }}>
      <div style={{ display: "flex", gap: 60, alignItems: "flex-start" }}>
        {/* Left side */}
        <div style={{ flex: 1 }}>
          <div
            style={{
              fontSize: 14,
              fontFamily: monoFamily,
              color: "#eab308",
              textTransform: "uppercase",
              letterSpacing: 3,
              marginBottom: 12,
              opacity: titleOp,
            }}
          >
            ● Análise Estatística
          </div>
          <h2
            style={{
              fontSize: 52,
              fontWeight: 700,
              color: "#f0f2f5",
              opacity: titleOp,
              marginBottom: 40,
              lineHeight: 1.2,
            }}
          >
            Mapa de calor dos{" "}
            <span style={{ background: "linear-gradient(90deg, #eab308, #22c55e)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              números
            </span>
          </h2>

          {/* Stats */}
          {[
            { label: "Números quentes", value: "07, 13, 34, 41", color: "#22c55e" },
            { label: "Números frios", value: "03, 19, 52, 57", color: "#ef4444" },
            { label: "Tendência de soma", value: "140 – 180", color: "#0ea5e9" },
          ].map((stat, i) => {
            const s = spring({ frame: frame - 15 - i * 8, fps, config: { damping: 20 } });
            return (
              <div
                key={stat.label}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "18px 0",
                  borderBottom: "1px solid rgba(255,255,255,0.06)",
                  opacity: s,
                  transform: `translateX(${interpolate(s, [0, 1], [-30, 0])}px)`,
                }}
              >
                <span style={{ fontSize: 18, color: "rgba(240,242,245,0.5)" }}>{stat.label}</span>
                <span style={{ fontSize: 20, fontFamily: monoFamily, fontWeight: 700, color: stat.color }}>{stat.value}</span>
              </div>
            );
          })}
        </div>

        {/* Heatmap */}
        <div
          style={{
            background: "rgba(255,255,255,0.02)",
            border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: 20,
            padding: 28,
          }}
        >
          <div style={{ display: "grid", gridTemplateColumns: "repeat(10, 1fr)", gap: 4, width: 600 }}>
            {cells.map((cell, i) => {
              const cellOp = interpolate(frame, [10 + i * 0.5, 20 + i * 0.5], [0, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });
              return (
                <div
                  key={cell.num}
                  style={{
                    aspectRatio: "1",
                    borderRadius: 6,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 14,
                    fontFamily: monoFamily,
                    fontWeight: 600,
                    color: `rgba(240,242,245,${cell.intensity * 0.7 + 0.2})`,
                    background: `rgba(34, 197, 94, ${cell.intensity * 0.5 * cellOp})`,
                    opacity: cellOp,
                  }}
                >
                  {cell.num.toString().padStart(2, "0")}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
