# msk-1.github.io

msk-1 が GitHub Pages で公開しているサイトの一覧。<https://msk-1.github.io/> で公開する。

## しくみ

- `sites.json` に、サイトごとの題名・説明・カテゴリ・タグ・撮影サイズを書く。ページを開くとまずこの内容を表示する
- 続けて GitHub API で Pages が有効な公開リポジトリを取得する。`sites.json` にないものは、カテゴリ「Other」として自動で追加する。サムネイルの代わりにリポジトリ名を大きく描いたカードを出す
- API が回数制限などで使えないときは、`sites.json` の内容だけで表示する
- 右下のカテゴリは `sites.json` の `category` から作る

## サイトを追加・更新したとき

1. `sites.json` に 1 件足す（`shot` は撮影時の画面サイズ。縦長にすると一覧で大きく見える）
2. サムネイルを撮る

   ```sh
   tools/capture.sh <repo>   # 1 サイトだけ
   tools/capture.sh          # 全サイト
   ```

   `thumbs/<repo>.jpg`（幅 800px）ができる。macOS の Google Chrome と `sips` を使う

3. `main` に push する

## ローカルでのプレビュー

```sh
python3 -m http.server 8001
```
