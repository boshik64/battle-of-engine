/**
 * База — ссылка из ТЗ, с метками. Голый karofilm.ru/film/16398 в кнопки не ставим.
 * utm_content пока черновик: buy_ticket / buy_ticket_andrey / buy_ticket_dmitry.
 */
const KARO_BASE =
  "https://karofilm.ru/film/16398?utm_source=bitva_motorov_landing&utm_medium=promo&utm_campaign=bitva_motorov_2026";

export type TicketContent = "buy_ticket" | "buy_ticket_andrey" | "buy_ticket_dmitry";

export function ticketUrl(content: TicketContent) {
  return `${KARO_BASE}&utm_content=${content}`;
}
