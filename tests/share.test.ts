import assert from "node:assert/strict";
import test from "node:test";
import { HEROES } from "../lib/heroes.ts";
import { sharePost, telegramShareUrl, vkShareUrl } from "../lib/share.ts";

const url = "https://battle.example/p/andrey";
const image = "https://battle.example/og/andrey.jpg";
const message = HEROES.andrey.shareText;

test("текст шаринга называет актёра", () => {
  assert.equal(
    HEROES.andrey.shareText,
    "Я поеду на битву моторов с Иваном Янковским",
  );
  assert.equal(
    HEROES.dmitry.shareText,
    "Я поеду на битву моторов с Юрой Борисовым",
  );
});

test("телеграм получает фразу и ссылку на страницу героя", () => {
  const parsed = new URL(telegramShareUrl(message, url));
  assert.equal(parsed.origin + parsed.pathname, "https://t.me/share/url");
  assert.equal(parsed.searchParams.get("text"), message);
  assert.equal(parsed.searchParams.get("url"), url);
});

test("вк получает фразу, ссылку и картинку героя", () => {
  const parsed = new URL(vkShareUrl(message, url, image));
  assert.equal(parsed.origin + parsed.pathname, "https://vk.com/share.php");
  assert.equal(parsed.searchParams.get("title"), message);
  assert.equal(parsed.searchParams.get("url"), url);
  assert.equal(parsed.searchParams.get("image"), image);
  assert.equal(parsed.searchParams.get("noparse"), "1");
});

test("копируется фраза и ссылка", () => {
  assert.equal(sharePost(message, url), `${message}\n${url}`);
});
