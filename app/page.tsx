import { FocusTime } from "@/components/focus-time";
import { WordMarquee } from "@/components/word-marquee";

export default function Home() {
  return (
    <>
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 40,
        }}
      >
        <WordMarquee direction="left" />
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
        }}
      >
        <FocusTime />
      </main>

      <div
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 40,
        }}
      >
        <WordMarquee direction="right" />
      </div>
    </>
  );
}