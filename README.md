# msk-1.github.io

msk-1 が GitHub Pages で公開しているサイトの一覧。<https://msk-1.github.io/> で公開する。

## しくみ

- `sites.json` に、サイトごとの題名・説明・カテゴリ・タグ・撮影サイズを書く。ページを開くとまずこの内容を表示する
- 続けて GitHub API で Pages が有効な公開リポジトリを取得する。`sites.json` にないものは、カテゴリ「Other」として自動で追加する
- API が回数制限などで使えないときは、`sites.json` の内容だけで表示する
- 右下のカテゴリは `sites.json` の `category` から作る

## サムネイルの自動更新

`.github/workflows/pages.yml` が毎日 03:00（JST）に動き、Pages が有効な全サイトを撮り直す。

1. `tools/capture.mjs` が Playwright（Chromium）で各サイトを撮り、`thumbs/<repo>.jpg`（幅 800px）に書く
2. 前回の画像と比べて差のある画素が 0.3% 未満なら書き換えない（撮るたびに数画素ずれる分を無視するため）
3. 画像が変わったときだけ github-actions[bot] がコミットし、同じ実行の中でサイトを公開し直す

新しいサイトを公開したときも、翌日の自動撮影でサムネイルが付く。すぐに撮りたいときは、Actions の画面から Pages ワークフローを手動実行する（`gh workflow run pages.yml`）。

撮影サイズは `sites.json` の `shot`（例: `"1280x1600"`）で決める。指定がなければ 1280x900。縦長にすると一覧で大きく見える。

## 手元で撮る場合

```sh
npm install --no-save playwright@1.49.1
npx playwright install chromium
node tools/capture.mjs            # 全サイト
node tools/capture.mjs <repo>     # 1 サイトだけ
```

## ローカルでのプレビュー

```sh
python3 -m http.server 8001
```
