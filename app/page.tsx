import { FocusTime } from "@/components/focus-time";
// import { WordMarquee } from "@/components/word-marquee";
import { FocusBackground } from "@/components/focus-background";
import { CarMarquee , WordMarqueen } from "@/components/marquee";
export default function Home() {
  return (
    <>
      {/* Top Bar */}
      <div className="fixed top-0 left-0 right-0 z-40 overflow-hidden">
        <div
          aria-hidden
          className="absolute inset-0 w-[calc(var(--focus-progress,0)*100%)] bg-(--focus-fill,var(--v-blue)) opacity-35 transition-[width] duration-1000 ease-linear pointer-events-none"
        />
        <WordMarqueen direction="left" speed="slow" />
      </div>

      <main className="relative min-h-dvh flex items-center justify-center pt-(--marquee-row-height,96px) pb-(--marquee-row-height,96px) font-limelight">
        <FocusBackground />
        <FocusTime />
      </main>

      {/* Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 overflow-hidden">
        <div
          aria-hidden
          className="absolute inset-0 w-[calc(var(--focus-progress,0)*100%)] bg-(--focus-fill,var(--v-blue)) opacity-35 transition-[width] duration-1000 ease-linear pointer-events-none"
        />
        <CarMarquee direction="right" speed="slow"/>
      </div>
    </>
  );
}
