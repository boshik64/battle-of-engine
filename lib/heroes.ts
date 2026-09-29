export const HERO_IDS = ["andrey", "dmitry"] as const;

export type HeroId = (typeof HERO_IDS)[number];

export type Trait = {
  label: string;
  value: string;
};

export type Hero = {
  id: HeroId;
  name: string;
  actor: string;
  /** «с …» в заголовке результата */
  withName: string;
  button: string;
  /** Короткая роль на экране коллажа */
  role: string;
  traits: Trait[];
  tagline: string;
  awaits: string;
  shareText: string;
  friendTitle: string;
  /** Кружок водителя на карточке */
  face: string;
  /** Фигура на экране коллажа */
  figure: string;
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
    button: "ЕДУ С НИМ",
    role: "Садится за руль и сразу жмёт газ",
    traits: [
      { label: "Маршрут", value: "Монако, без остановок" },
      { label: "За рулём", value: "Обгон вместо тормоза" },
      { label: "В салоне", value: "Авантюра и усы" },
    ],
    tagline: "Маршрут: в Монако. Настрой: доедем",
    awaits: "дорога до Монако и водитель, для которого спидометр — просто украшение.",
    shareText: "Я поеду на битву моторов с Иваном Янковским",
    friendTitle: "АНДРЕЙ НАГЕЛЬ — ВЫБОР ТВОЕГО ДРУГА",
    face: "/heroes/andrey-face.jpg",
    figure: "/heroes/andrey-wide.jpg",
    image: "/heroes/andrey-face.jpg",
    scene: "/heroes/andrey-scene.jpg",
    og: "/og/andrey.jpg",
  },
  dmitry: {
    id: "dmitry",
    name: "Дмитрий Бондарев",
    actor: "Юра Борисов",
    withName: "Дмитрием Бондаревым",
    button: "ЕДУ С НИМ",
    role: "Ведёт ровно. Нервничать будешь ты",
    traits: [
      { label: "Маршрут", value: "Туда, куда договорились" },
      { label: "За рулём", value: "Мотор под контролем" },
      { label: "В салоне", value: "Тишина и характер" },
    ],
    tagline: "Мотор под контролем. Приключения — как получится",
    awaits: "ровная тяга, тихий салон и поездка, после которой просишь ещё круг.",
    shareText: "Я поеду на битву моторов с Юрой Борисовым",
    friendTitle: "ДМИТРИЙ БОНДАРЕВ — ВЫБОР ТВОЕГО ДРУГА",
    face: "/heroes/dmitry-face.jpg",
    figure: "/heroes/dmitry-wide.jpg",
    image: "/heroes/dmitry-face.jpg",
    scene: "/heroes/dmitry-figure.jpg",
    og: "/og/dmitry.jpg",
  },
};

export function isHeroId(value: string): value is HeroId {
  return value === "andrey" || value === "dmitry";
}

export function sharePath(hero: HeroId) {
  return `/p/${hero}`;
}
