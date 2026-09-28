export function sharePost(message: string, url: string) {
  return `${message}\n${url}`;
}

export function telegramShareUrl(message: string, url: string, embedLink = false) {
  // Пробел через %20. URLSearchParams ставит «+», и приложение Telegram на телефоне
  // показывает плюсы в тексте сообщения.
  // Мобильное приложение отбрасывает параметр url и вставляет только text,
  // поэтому на телефоне ссылку кладём в сам текст.
  const text = embedLink ? `${message}\n${url}` : message;
  return `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;
}

export function vkShareUrl(message: string, url: string, imageUrl: string) {
  const params = new URLSearchParams({
    url,
    title: message,
    image: imageUrl,
    noparse: "1",
  });
  return `https://vk.com/share.php?${params.toString()}`;
}
