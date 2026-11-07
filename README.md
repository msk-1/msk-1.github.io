# msk-1.github.io

msk-1 が GitHub Pages で公開しているサイトの一覧。<https://msk-1.github.io/> で公開する。

## しくみ

- `sites.json` に、表示したい題名・説明・タグ・色相を書く。ページを開くとまずこの内容を表示する
- 続けて GitHub API で Pages が有効な公開リポジトリを取得する。`sites.json` にないものは、リポジトリ名と説明で自動的に追加する。更新日もここから埋める
- API が回数制限などで使えないときは、`sites.json` の内容だけで表示する

新しいサイトを公開したときは、何もしなくても一覧に出る。題名や説明を整えたいときだけ `sites.json` に 1 件足す。

## ローカルでのプレビュー

```sh
python3 -m http.server 8001
```
