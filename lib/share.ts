export function sharePost(message: string, url: string) {
  return `${message}\n${url}`;
}

export function telegramShareUrl(message: string, url: string) {
  // Пробел через %20. URLSearchParams ставит «+», и приложение Telegram на телефоне
  // показывает плюсы в тексте сообщения.
  return `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(message)}`;
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
