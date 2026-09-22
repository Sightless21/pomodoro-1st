"use client";

import { Marquee } from "@/components/ui/marquee";
import { Title } from "@/components/ui/typography";

interface WordMarqueeProps {
    direction?: "left" | "right";
    words?: string[];

}

const wordlist = [
  "Gonx",
  "DONT OVERTHINK",
  "JUST START",
]
export function WordMarquee({ direction = "left", words = wordlist }: WordMarqueeProps) {
  return (
    <Marquee
    direction={direction} 
    pixelsPerSecond={80}
    label=""
    hideHeader
    className="border"
    >
      {words.map((word) => (
        <Title
          key={word}
          as="span"
          style={{ fontSize: "clamp(30px,4vw,50px)", fontWeight: 700, fontFamily: "var(--font-limelight)" }}
        >
          {word}
        </Title>
      ))}
    </Marquee>
  );
}