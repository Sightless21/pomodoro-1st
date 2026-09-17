import { FocusTime } from "@/components/focus-time";
import {WordMarquee} from "@/components/word-marquee";

export default function Home() {
  return (
    <main>
        <WordMarquee direction="left"/>
      <div className="">
        <FocusTime />
      </div>

        <WordMarquee direction="right"/>
    </main>
  );
}