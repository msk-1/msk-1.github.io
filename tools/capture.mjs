// GitHub Pages で公開しているサイトのサムネイルを thumbs/<repo>.jpg に撮る
// 対象: GitHub API で見つけた Pages が有効な公開リポジトリ（フォークとこのリポジトリを除く）と sites.json のサイト
// 撮影サイズは sites.json の "shot"（例: "1280x1600"）。指定がなければ 1280x900。出力は幅 800px の JPEG
//
// 使い方: node tools/capture.mjs            … 全サイト
//         node tools/capture.mjs <repo>     … 1 サイトだけ
// 必要なもの: npm install --no-save playwright@1.49.1 && npx playwright install chromium
import { chromium } from "playwright";
import fs from "node:fs/promises";

const USER = "msk-1";
const SELF = `${USER}.github.io`;
const OUT_WIDTH = 800;
const only = process.argv[2];

const curated = JSON.parse(await fs.readFile("sites.json", "utf8"));
const byRepo = Object.fromEntries(curated.map((c) => [c.repo, c]));

const headers = { Accept: "application/vnd.github+json" };
if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
const res = await fetch(`https://api.github.com/users/${USER}/repos?per_page=100&type=owner`, { headers });
if (!res.ok) throw new Error(`GitHub API が ${res.status} を返した`);
const repos = (await res.json()).filter((r) => r.has_pages && !r.fork && !r.private && r.name !== SELF);

const targets = new Map();
for (const r of repos) {
  const c = byRepo[r.name] || {};
  targets.set(r.name, { url: c.url || r.homepage || `https://${USER}.github.io/${r.name}/`, shot: c.shot || "1280x900" });
}
for (const c of curated) {
  if (!targets.has(c.repo)) targets.set(c.repo, { url: c.url || `https://${USER}.github.io/${c.repo}/`, shot: c.shot || "1280x900" });
}

// 前回の画像と比べて、目に見える差があるか調べる。
// 同じ見た目でも撮るたびに数画素ずれることがあるので、差のある画素が 0.3% 未満なら「変化なし」とみなす
async function looksSame(page, oldBuf, newBuf) {
  return page.evaluate(async ([a, b]) => {
    const load = (b64) => new Promise((ok, ng) => {
      const img = new Image();
      img.onload = () => ok(img);
      img.onerror = ng;
      img.src = "data:image/jpeg;base64," + b64;
    });
    const [x, y] = await Promise.all([load(a), load(b)]);
    if (x.width !== y.width || x.height !== y.height) return false;
    const pixels = (img) => {
      const c = document.createElement("canvas");
      c.width = img.width;
      c.height = img.height;
      const g = c.getContext("2d");
      g.drawImage(img, 0, 0);
      return g.getImageData(0, 0, img.width, img.height).data;
    };
    const p = pixels(x), q = pixels(y);
    let diff = 0;
    for (let i = 0; i < p.length; i += 4) {
      if (Math.abs(p[i] - q[i]) > 24 || Math.abs(p[i + 1] - q[i + 1]) > 24 || Math.abs(p[i + 2] - q[i + 2]) > 24) diff += 1;
    }
    return diff / (p.length / 4) < 0.003;
  }, [oldBuf.toString("base64"), newBuf.toString("base64")]);
}

await fs.mkdir("thumbs", { recursive: true });
const browser = await chromium.launch();
const compareContext = await browser.newContext();
const comparePage = await compareContext.newPage();
let failed = 0;
for (const [repo, t] of targets) {
  if (only && only !== repo) continue;
  const [width, height] = t.shot.split("x").map(Number);
  // 動きのある背景は止めて撮る（毎日同じ画像になるようにするため）
  const context = await browser.newContext({
    viewport: { width, height },
    deviceScaleFactor: OUT_WIDTH / width,
    reducedMotion: "reduce",
    locale: "ja-JP",
  });
  const page = await context.newPage();
  try {
    await page.goto(t.url, { waitUntil: "networkidle", timeout: 60000 });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(1000);
    const shot = await page.screenshot({ type: "jpeg", quality: 82 });
    const path = `thumbs/${repo}.jpg`;
    const old = await fs.readFile(path).catch(() => null);
    if (old && (await looksSame(comparePage, old, shot))) {
      console.log(`${path}  変化なし`);
    } else {
      await fs.writeFile(path, shot);
      console.log(`${path}  ${old ? "更新" : "新規"}  ${t.shot}  ${t.url}`);
    }
  } catch (e) {
    failed += 1;
    console.error(`撮影に失敗した: ${repo} (${t.url}): ${e.message}`);
  } finally {
    await context.close();
  }
}
await compareContext.close();
await browser.close();
if (failed) process.exitCode = 1;
