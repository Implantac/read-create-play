import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";
import { loadFont } from "@remotion/google-fonts/SpaceGrotesk";
import { loadFont as loadMono } from "@remotion/google-fonts/JetBrainsMono";

const { fontFamily } = loadFont("normal", { weights: ["400", "600", "700"], subsets: ["latin"] });
const { fontFamily: monoFamily } = loadMono("normal", { weights: ["400", "600", "700"], subsets: ["latin"] });

export const SceneCTA: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const s = spring({ frame, fps, config: { damping: 15 } });
  const titleY = interpolate(s, [0, 1], [60, 0]);
  const subOp = interpolate(frame, [20, 40], [0, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });
  const btnS = spring({ frame: frame - 30, fps, config: { damping: 12 } });

  // Pulsing glow
  const pulse = Math.sin(frame * 0.08) * 0.3 + 0.7;

  return (
    <AbsoluteFill style={{ fontFamily, justifyContent: "center", alignItems: "center" }}>
      {/* Central glow */}
      <div
        style={{
          position: "absolute",
          width: 600,
          height: 600,
          borderRadius: "50%",
          background: `radial-gradient(circle, rgba(34, 197, 94, ${0.08 * pulse}) 0%, transparent 70%)`,
        }}
      />

      <div style={{ textAlign: "center", zIndex: 2 }}>
        <h2
          style={{
            fontSize: 72,
            fontWeight: 700,
            color: "#f0f2f5",
            transform: `translateY(${titleY}px)`,
            opacity: s,
            lineHeight: 1.15,
            maxWidth: 900,
          }}
        >
          Jogue com{" "}
          <span
            style={{
              background: "linear-gradient(90deg, #22c55e, #0ea5e9)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            inteligência
          </span>
        </h2>

        <p style={{ fontSize: 26, color: "rgba(240,242,245,0.5)", marginTop: 24, opacity: subOp }}>
          Comece grátis — sem cartão de crédito
        </p>

        {/* CTA button */}
        <div
          style={{
            marginTop: 48,
            display: "inline-flex",
            alignItems: "center",
            gap: 12,
            padding: "20px 48px",
            borderRadius: 14,
            background: "linear-gradient(135deg, #22c55e, #0ea5e9)",
            fontSize: 24,
            fontWeight: 700,
            color: "#0a0e14",
            transform: `scale(${btnS})`,
            boxShadow: `0 0 ${60 * pulse}px rgba(34, 197, 94, ${0.3 * pulse})`,
          }}
        >
          Testar Grátis Agora →
        </div>

        <div style={{ marginTop: 32, display: "flex", justifyContent: "center", gap: 40, opacity: subOp }}>
          {["10.000+ sorteios", "8 loterias", "14+ algoritmos"].map((t) => (
            <span key={t} style={{ fontSize: 14, fontFamily: monoFamily, color: "rgba(240,242,245,0.4)", letterSpacing: 1 }}>
              {t}
            </span>
          ))}
        </div>

        <div style={{ marginTop: 60, opacity: interpolate(frame, [40, 60], [0, 0.6], { extrapolateRight: "clamp", extrapolateLeft: "clamp" }) }}>
          <span style={{ fontSize: 16, fontFamily: monoFamily, color: "rgba(240,242,245,0.3)", letterSpacing: 2 }}>
            titan-loterias.com
          </span>
        </div>
      </div>
    </AbsoluteFill>
  );
};
