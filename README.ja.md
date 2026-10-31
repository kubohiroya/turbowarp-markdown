# TurboWarp Markdown

<img src="assets/block-icon.svg" alt="" width="48" height="48">

[English](README.md) | 日本語

TurboWarp 上で Markdown を immutable な構造化フラグメントとして組み立て、最後の出力境界でだけ Markdown 文字列へレンダリングする拡張です。

## 実行できるサンプル

[**TurboWarp Editorでデモを開く**](https://turbowarp.org/editor?project_url=https%3A%2F%2Fkubohiroya.github.io%2Fturbowarp-markdown%2Fsamples%2Fbuild-markdown-card.sb3) · [SB3をダウンロード](https://kubohiroya.github.io/turbowarp-markdown/samples/build-markdown-card.sb3)

**Allow**で読み込みを許可し、緑の旗を押します。
`heading`・`bold`・`paragraph`・`render`で短い紹介文を生成し、結果のMarkdown文字列を表示。サンプルの元データと期待結果は[`samples/README.md`](samples/README.md)に記載しています。

`pnpm run samples:build`でSB3を再生成し、`pnpm run samples:check`で更新漏れと生成処理を確認します。

## 概要

- エスケープ済み text、bold、italic、link、inline code を作れます。
- heading、paragraph、quote、fenced code block、ordered/unordered list を作れます。
- 合成は入力を変更せず、新しいフラグメントを返します。
- CommonMark 寄りの Markdown を決定的にレンダリングします。
- validation なしの Markdown 化と、validation して直近 error を保持する Markdown 化を選べます。
- ブロックなしで使える TypeScript composition API も `src/markdown.ts` から提供します。

## HTTP Server 連携

`turbowarp-http-server` とは npm パッケージ依存では結合しません。Markdown 拡張で作ったフラグメントを `render Markdown` で文字列化し、HTTP レスポンス本文として渡してください。content type は `text/markdown; charset=utf-8` を明示する想定です。

## Document Dataで解析・読み取りする

`turbowarp-markdown:v1:`の値は組み立て用の形式で、読み取るための木ではありません。箇条書きの項目やinlineの中身が入れ子の`sequence`に入ることがあり、中身が1つのときと複数のときで形も変わります。組み立てた文書の一部を読み取ったり置き換えたり、構造を順にたどったりするときは、`render Markdown`で文字列にして[TurboWarp Document Data](https://github.com/kubohiroya/turbowarp-document-data)へ渡してください。

```text
parse Markdown (render Markdown (fragment)) as document [doc]
```

Document Dataは解析したMarkdownをmdastの木として保持し、子は常に平らな`children`配列に並びます。位置を指定してtextを読み取り・置き換えるblockがあります。2つの拡張はnpmパッケージ依存を持たず、描画した文字列だけを受け渡すため、この拡張はサンドボックス内のまま動作します。Document Data自体はサンドボックスなしで動作します。

## 開発

```bash
npm install --global corepack@latest
corepack enable
pnpm install --frozen-lockfile
pnpm run check
```

## ライセンス

SPDX-License-Identifier: MPL-2.0

固定入力の編集範囲・互換性・切戻しについては [固定入力の編集](docs/fixed-input-editors.ja.md) を参照してください。
