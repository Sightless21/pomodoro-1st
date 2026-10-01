export const AMBIENT = {
  rainy: { label: "Rainy Weather", file: "rainy-ambient.mp3" },
  fireplace: { label: "Fireplace", file: "fireplace-ambient.mp3" },
  writingPaper: { label: "Writing Paper", file: "writing-paper.mp3" },
  evening: { label: "Evening", file: "evening-ambient.mp3" },
} as const;

export type SoundName = keyof typeof AMBIENT;