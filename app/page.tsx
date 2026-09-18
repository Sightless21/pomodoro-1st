import { FocusTime } from "@/components/focus-time";
import { WordMarquee } from "@/components/word-marquee";

// Shared look for the fixed top/bottom bars — overflow hidden so the fill
// underneath never spills past the bar's own edges.
const barShell: React.CSSProperties = {
  position: "fixed",
  left: 0,
  right: 0,
  zIndex: 40,
  overflow: "hidden",
};

// Grows from 0% to 100% width as --focus-progress goes 0 → 1, like an HP
// bar filling up. --focus-progress and --focus-fill are written by
// FocusTime (components/focus-time.tsx) on every countdown tick.
const progressFill: React.CSSProperties = {
  position: "absolute",
  inset: 0,
  width: "calc(var(--focus-progress, 0) * 100%)",
  background: "var(--focus-fill, var(--v-blue))",
  opacity: 0.35,
  transition: "width 1s linear",
  pointerEvents: "none",
};

export default function Home() {
  return (
    <>
      <div style={{ ...barShell, top: 0 }}>
        <div aria-hidden style={progressFill} />
        <WordMarquee direction="left" />
        {/* navigation */}
      </div>

      <main
        style={{
          minHeight: "100dvh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          // Keep content clear of the fixed marquee rows above/below.
          paddingTop: "var(--marquee-row-height, 96px)",
          paddingBottom: "var(--marquee-row-height, 96px)",
          fontFamily: "var(--font-limelight)",
        }}
      >
        <FocusTime />
      </main>

      <div style={{ ...barShell, bottom: 0 }}>
        <div aria-hidden style={progressFill} />
        <WordMarquee direction="right" />
      </div>
    </>
  );
}