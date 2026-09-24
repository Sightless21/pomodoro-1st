"use client";

import {
  Marquee,
  type MarqueeDirection,
  type MarqueeSpeed,
} from "@/components/ui/marquee";
import { Shape } from "@/components/ui/shape";
import { Title, BodySecondary } from "@/components/ui/typography";
import { cn } from "@/lib/utils";

interface MarqueeProps {
  direction?: MarqueeDirection;
  speed?: MarqueeSpeed;
}

interface WordMarqueeProps extends MarqueeProps {
  words?: Word[];
}

interface CardMarqueeProps extends MarqueeProps {
  topics?: Topic[];
  cardBackground?: boolean;
}

type Word = {
  title: string;
  shape: string;
  color: string;
};

type Topic = Word & {
  note: string;
};

const topicDefault: Topic[] = [
  {
    title: "Make something useful",
    note: "Ideas into everyday tools",
    shape: "star-8",
    color: "var(--v-blue)",
  },
  {
    title: "Leave room to explore",
    note: "Small experiments welcome",
    shape: "blob-4",
    color: "var(--v-olive)",
  },
  {
    title: "Share what you learn",
    note: "A good idea travels",
    shape: "star-4",
    color: "var(--v-pink)",
  },
  {
    title: "Find your own rhythm",
    note: "Steady is a good speed",
    shape: "circle",
    color: "var(--v-yellow)",
  },
];

const wordsDefault: Word[] = [
  {
    title: "Gonx",
    shape: "aster-9",
    color: "var(--v-olive)",
  },
  {
    title: "Focus, don't fidget",
    shape: "clover-soft",
    color: "var(--v-pink)",
  },
  {
    title: "'gonx' says: ไปห้องน้ำ",
    shape: "seed-wing",
    color: "var(--v-yellow)",
  },
  {
    title: "Small breaks",
    shape: "petal-7",
    color: "var(--v-blue)",
  },
  {
    title: "Tomato, so serious",
    shape: "cloud-3",
    color: "var(--v-pink)",
  },
];

export function CarMarquee({
  direction = "right",
  speed = "normal",
  cardBackground = false,
  topics = topicDefault,
}: CardMarqueeProps) {
  return (
    <Marquee
      direction={direction}
      pixelsPerSecond={30}
      speed={speed}
      hideHeader
      className="border font-limelight"
    >
      {topics.map((topic, index) => (
        <div
          key={index}
          className={cn(
            `${cardBackground ? `bg-white rounded-2xl` : `rounded-[--r-card] bg-[--card]`}`,
            `flex min-w-0 items-center gap-4 px-5 py-4`,
          )}
        >
          <Shape
            name={topic.shape}
            className="size-12"
            style={{ "--c": topic.color } as React.CSSProperties}
          />
          <div className="grid min-w-0 gap-1">
            <Title as="h4" className="text-base">
              {topic.title}
            </Title>
            <BodySecondary className="text-sm">{topic.note}</BodySecondary>
          </div>
        </div>
      ))}
    </Marquee>
  );
}

export function WordMarqueen({
  direction = "left",
  speed = "normal",
  words = wordsDefault,
}: WordMarqueeProps) {
  return (
    <Marquee
      direction={direction}
      pixelsPerSecond={30}
      hideHeader
      className="border font-limelight"
      speed={speed}
    >
      {words.map((word, index) => (
        <div key={index} className="flex items-center min-w-0 gap-4 px-5 py-4">
          <Shape
            name={word.shape}
            className="size-12"
            style={{ "--c": word.color } as React.CSSProperties}
          />
          <div className="grid min-w-0 gap-1">
            <Title as="span" className="text-4xl!">{word.title}</Title>
          </div>
        </div>
      ))}
    </Marquee>
  );
}
