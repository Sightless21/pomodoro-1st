import { FocusTime } from "@/components/focus-time";

export default function Home() {
  return (
    <main className="flex h-screen items-center justify-center">
      <p className="text-7xl font-bold" style={{ fontFamily: "var(--font-limelight)" }}>
        < FocusTime />
      </p>
    </main>
  )
}