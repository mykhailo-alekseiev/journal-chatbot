export const JOURNAL_PRESETS = [
  {
    id: "feeling",
    label: "Як я себе почуваю?",
    message: "Як я себе почуваю сьогодні?",
  },
  {
    id: "day",
    label: "Розповісти про день",
    message: "Хочу розповісти про свій день",
  },
  {
    id: "reflect",
    label: "Порефлексувати",
    message: "Хочу порефлексувати",
  },
  {
    id: "mood",
    label: "Що на думці?",
    message: "Що в мене зараз на думці?",
  },
] as const;

export type JournalPreset = (typeof JOURNAL_PRESETS)[number];
