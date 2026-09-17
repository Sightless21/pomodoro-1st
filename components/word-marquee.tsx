"use client";

import { Marquee } from "@/components/ui/marquee";
import { Title } from "@/components/ui/typography";

const words = ["A little wonder", "Room to grow", "Ideas in motion"];
interface WordMarqueeProps {
    direction?: "left" | "right";

}
export function WordMarquee({ direction = "left" }: WordMarqueeProps) {
  return (
    <Marquee
    direction={direction} 
    pixelsPerSecond={60}
    label=""
    hideHeader
    >
      {words.map((word) => (
        <Title
          key={word}
          as="span"
          style={{ fontSize: "clamp(32px,5vw,60px)", fontWeight: 700, fontFamily: "var(--font-heading)" }}
        >
          {word}
        </Title>
      ))}
    </Marquee>
  );
}