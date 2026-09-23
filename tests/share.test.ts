import assert from "node:assert/strict";
import test from "node:test";
import { HEROES } from "../lib/heroes.ts";
import {
  detectShareFamily,
  sharePayloads,
  sharePost,
  type SharePayload,
} from "../lib/share.ts";

const url = "https://battle.example/p/andrey";
const message = HEROES.andrey.shareText;

function assertHasSentenceAndLink(payload: SharePayload) {
  const body = `${payload.text}\n${payload.url ?? ""}`;
  assert.match(body, /Я поеду на битву моторов с Иваном Янковским/);
  assert.match(body, /https:\/\/battle\.example\/p\/andrey/);
  assert.equal("files" in payload, false);
  assert.equal("title" in payload, false);
}

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

test("iPhone, iPad и Safari не получают отдельную ссылку", () => {
  assert.equal(
    detectShareFamily({
      userAgent:
        "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1",
      maxTouchPoints: 5,
    }),
    "webkit",
  );
  assert.equal(
    detectShareFamily({
      userAgent:
        "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/128.0.6613.98 Mobile/15E148 Safari/604.1",
      maxTouchPoints: 5,
    }),
    "webkit",
  );
  assert.equal(
    detectShareFamily({
      userAgent:
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15",
      maxTouchPoints: 5,
    }),
    "webkit",
  );
  assert.equal(
    detectShareFamily({
      userAgent:
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15",
      maxTouchPoints: 0,
    }),
    "webkit",
  );

  const [payload] = sharePayloads("webkit", message, url);
  assert.equal(payload.url, undefined);
  assert.equal(payload.text, sharePost(message, url));
  assertHasSentenceAndLink(payload);
});

test("Android и Chrome получают фразу и ссылку без дубля и без файла", () => {
  assert.equal(
    detectShareFamily({
      userAgent:
        "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Mobile Safari/537.36",
      maxTouchPoints: 5,
    }),
    "default",
  );
  assert.equal(
    detectShareFamily({
      userAgent:
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
      maxTouchPoints: 0,
    }),
    "default",
  );

  const [payload, fallback] = sharePayloads("default", message, url);
  assert.equal(payload.text, message);
  assert.equal(payload.text.includes(url), false);
  assert.equal(payload.url, url);
  assert.equal(fallback.text, sharePost(message, url));
  assert.equal(fallback.url, undefined);
  assertHasSentenceAndLink(payload);
  assertHasSentenceAndLink(fallback);
});
