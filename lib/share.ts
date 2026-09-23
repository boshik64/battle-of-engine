export type ShareFamily = "webkit" | "default";

export type SharePayload = {
  text: string;
  url?: string;
};

/**
 * Меню «Поделиться» не сообщает приложение-получатель, поэтому состав
 * сообщения выбирается по устройству.
 * На iOS и Safari отдельное поле url оставляет только ссылку, а файл — только фото.
 * Заголовок title Telegram подставляет вместо фразы.
 * Картинка героя берётся из превью страницы /p/:hero, а не из вложения.
 */
export function detectShareFamily(env: {
  userAgent: string;
  maxTouchPoints: number;
}): ShareFamily {
  const ua = env.userAgent;
  const ios =
    /iPad|iPhone|iPod/.test(ua) ||
    (/Macintosh/.test(ua) &&
      env.maxTouchPoints > 1 &&
      !/Chrome|Chromium|Edg\//.test(ua));
  if (ios) return "webkit";
  const safari =
    /Safari\//.test(ua) && !/Chrome|Chromium|Android|Edg\/|OPR\//.test(ua);
  if (safari) return "webkit";
  return "default";
}

export function sharePost(message: string, url: string) {
  return `${message}\n${url}`;
}

export function sharePayloads(
  family: ShareFamily,
  message: string,
  url: string,
): SharePayload[] {
  const textWithLink = { text: sharePost(message, url) };
  if (family === "webkit") return [textWithLink];
  return [{ text: message, url }, textWithLink];
}
