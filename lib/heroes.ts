export const HERO_IDS = ["andrey", "dmitry"] as const;

export type HeroId = (typeof HERO_IDS)[number];

export type Hero = {
  id: HeroId;
  name: string;
  actor: string;
  /** «с …» в заголовке результата */
  withName: string;
  button: string;
  tagline: string;
  awaits: string;
  shareText: string;
  friendTitle: string;
  /** Портрет для карточки. Кадры трейлера, не сток. */
  image: string;
  /** Крупный кадр экрана результата. */
  scene: string;
  og: string;
};

export const HEROES: Record<HeroId, Hero> = {
  andrey: {
    id: "andrey",
    name: "Андрей Нагель",
    actor: "Иван Янковский",
    withName: "Андреем Нагелем",
    button: "ПОЕДУ С АНДРЕЕМ",
    tagline: "Маршрут: в Монако. Настрой: доедем",
    awaits:
      "авантюра до Монако. Янковский рядом — главное, не забывать смотреть на дорогу.",
    shareText:
      "Мой попутчик в „Битве моторов“ — Андрей Нагель. А с кем отправишься ты?",
    friendTitle: "АНДРЕЙ НАГЕЛЬ — ВЫБОР ТВОЕГО ДРУГА",
    image: "/heroes/andrey.jpg",
    scene: "/heroes/andrey.jpg",
    og: "/og/andrey.jpg",
  },
  dmitry: {
    id: "dmitry",
    name: "Дмитрий Бондарев",
    actor: "Юра Борисов",
    withName: "Дмитрием Бондаревым",
    button: "ПОЕДУ С ДМИТРИЕМ",
    tagline: "Мотор под контролем. Приключения — как получится",
    awaits:
      "поездка с Борисовым. Мотор под контролем. Твоё сердцебиение — вряд ли.",
    shareText:
      "Мой попутчик в „Битве моторов“ — Дмитрий Бондарев. А с кем отправишься ты?",
    friendTitle: "ДМИТРИЙ БОНДАРЕВ — ВЫБОР ТВОЕГО ДРУГА",
    image: "/heroes/dmitry.jpg",
    scene: "/heroes/dmitry.jpg",
    og: "/og/dmitry.jpg",
  },
};

export function isHeroId(value: string): value is HeroId {
  return value === "andrey" || value === "dmitry";
}

export function sharePath(hero: HeroId) {
  return `/p/${hero}`;
}
