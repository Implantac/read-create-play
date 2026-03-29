import { AbsoluteFill, useCurrentFrame, interpolate, Sequence } from "remotion";
import { TransitionSeries, springTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { slide } from "@remotion/transitions/slide";
import { SceneHero } from "./scenes/SceneHero";
import { SceneDashboard } from "./scenes/SceneDashboard";
import { SceneGenerator } from "./scenes/SceneGenerator";
import { SceneStats } from "./scenes/SceneStats";
import { SceneCTA } from "./scenes/SceneCTA";

export const MainVideo: React.FC = () => {
  const frame = useCurrentFrame();

  // Persistent animated background
  const bgHue1 = interpolate(frame, [0, 600], [145, 195]);
  const bgHue2 = interpolate(frame, [0, 600], [225, 265]);

  return (
    <AbsoluteFill style={{ background: "#0a0e14" }}>
      {/* Animated gradient background */}
      <AbsoluteFill
        style={{
          background: `
            radial-gradient(ellipse 60% 50% at 20% 30%, hsla(${bgHue1}, 72%, 42%, 0.08) 0%, transparent 70%),
            radial-gradient(ellipse 50% 60% at 80% 70%, hsla(${bgHue2}, 75%, 50%, 0.06) 0%, transparent 70%),
            linear-gradient(180deg, #0a0e14 0%, #0d1117 50%, #0a0e14 100%)
          `,
        }}
      />

      {/* Floating grid pattern */}
      <AbsoluteFill
        style={{
          opacity: 0.03,
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
          transform: `translateY(${interpolate(frame, [0, 600], [0, -80])}px)`,
        }}
      />

      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={140}>
          <SceneHero />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={fade()}
          timing={springTiming({ config: { damping: 200 }, durationInFrames: 20 })}
        />
        <TransitionSeries.Sequence durationInFrames={120}>
          <SceneDashboard />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={slide({ direction: "from-right" })}
          timing={springTiming({ config: { damping: 200 }, durationInFrames: 20 })}
        />
        <TransitionSeries.Sequence durationInFrames={120}>
          <SceneGenerator />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={fade()}
          timing={springTiming({ config: { damping: 200 }, durationInFrames: 20 })}
        />
        <TransitionSeries.Sequence durationInFrames={120}>
          <SceneStats />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={fade()}
          timing={springTiming({ config: { damping: 200 }, durationInFrames: 20 })}
        />
        <TransitionSeries.Sequence durationInFrames={160}>
          <SceneCTA />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  );
};
