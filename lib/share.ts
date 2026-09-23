export function sharePost(message: string, url: string) {
  return `${message}\n${url}`;
}

export function telegramShareUrl(message: string, url: string) {
  const params = new URLSearchParams({ url, text: message });
  return `https://t.me/share/url?${params.toString()}`;
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
