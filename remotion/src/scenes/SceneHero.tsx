import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring, Sequence } from "remotion";
import { loadFont } from "@remotion/google-fonts/SpaceGrotesk";

const { fontFamily } = loadFont("normal", { weights: ["400", "700"], subsets: ["latin"] });

export const SceneHero: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const logoScale = spring({ frame, fps, config: { damping: 15, stiffness: 120 } });
  const titleY = interpolate(spring({ frame: frame - 15, fps, config: { damping: 20 } }), [0, 1], [60, 0]);
  const titleOp = interpolate(frame, [15, 35], [0, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });
  const subOp = interpolate(frame, [30, 50], [0, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });
  const subY = interpolate(spring({ frame: frame - 30, fps, config: { damping: 20 } }), [0, 1], [40, 0]);

  // Floating lottery balls
  const balls = [
    { n: "07", x: 300, y: 200, delay: 5 },
    { n: "13", x: 1500, y: 300, delay: 10 },
    { n: "22", x: 400, y: 700, delay: 8 },
    { n: "34", x: 1600, y: 650, delay: 12 },
    { n: "41", x: 200, y: 450, delay: 15 },
    { n: "58", x: 1700, y: 180, delay: 7 },
  ];

  return (
    <AbsoluteFill style={{ fontFamily, justifyContent: "center", alignItems: "center" }}>
      {/* Floating balls */}
      {balls.map((b) => {
        const s = spring({ frame: frame - b.delay, fps, config: { damping: 12 } });
        const float = Math.sin((frame + b.delay * 10) * 0.05) * 8;
        return (
          <div
            key={b.n}
            style={{
              position: "absolute",
              left: b.x,
              top: b.y + float,
              width: 80,
              height: 80,
              borderRadius: "50%",
              background: "linear-gradient(135deg, #22c55e, #0ea5e9)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 28,
              fontWeight: 700,
              color: "#0a0e14",
              transform: `scale(${s})`,
              opacity: 0.15,
              boxShadow: "0 4px 20px rgba(34, 197, 94, 0.2)",
            }}
          >
            {b.n}
          </div>
        );
      })}

      {/* Center content */}
      <div style={{ textAlign: "center", zIndex: 2 }}>
        {/* Logo pulse */}
        <div
          style={{
            width: 100,
            height: 100,
            borderRadius: 24,
            background: "linear-gradient(135deg, #22c55e, #0ea5e9)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 40px",
            transform: `scale(${logoScale})`,
            boxShadow: "0 0 60px rgba(34, 197, 94, 0.3)",
          }}
        >
          <span style={{ fontSize: 48, fontWeight: 700, color: "#0a0e14" }}>T</span>
        </div>

        <h1
          style={{
            fontSize: 88,
            fontWeight: 700,
            color: "#f0f2f5",
            letterSpacing: "-0.02em",
            lineHeight: 1.1,
            transform: `translateY(${titleY}px)`,
            opacity: titleOp,
          }}
        >
          Titan{" "}
          <span
            style={{
              background: "linear-gradient(90deg, #22c55e, #0ea5e9)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Loterias
          </span>
        </h1>

        <p
          style={{
            fontSize: 32,
            color: "rgba(240, 242, 245, 0.6)",
            marginTop: 20,
            transform: `translateY(${subY}px)`,
            opacity: subOp,
            maxWidth: 800,
            margin: "20px auto 0",
          }}
        >
          Inteligência Artificial para suas apostas
        </p>
      </div>
    </AbsoluteFill>
  );
};
