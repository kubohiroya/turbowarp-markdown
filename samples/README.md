# Markdownの最小デモ

- 配布: [`build-markdown-card.sb3`](https://kubohiroya.github.io/turbowarp-markdown/samples/build-markdown-card.sb3)
- 起動: [TurboWarp Editor](https://turbowarp.org/editor?project_url=https%3A%2F%2Fkubohiroya.github.io%2Fturbowarp-markdown%2Fsamples%2Fbuild-markdown-card.sb3)
- 操作: **Allow**で読み込みを許可し、緑の旗を押します。
- 内容: `heading`・`bold`・`paragraph`・`render`で短い紹介文を生成し、結果のMarkdown文字列を表示
- 期待結果: Markdown outputは`# Demo`の見出しと`**Ready**`の段落を含む文字列になります。

`manifest.json`に拡張ID・JSパス・sandbox条件・期待結果を記録しています。
`build-markdown-card/project.json`と自作SVGを編集し、次のコマンドで再生成します。

```bash
pnpm run samples:build
pnpm run samples:check
pnpm run pages:build
```

Node.jsは`.nvmrc`指定版を使います。サンプル生成に追加依存はありません。
生成したSB3もコミットし、`_site/`のdocs・dist・SB3をPagesへ公開します。
unsandboxed拡張は検証対象JSをSB3へ同梱し、利用者が通常の同意画面で許可します。
sandbox互換の拡張はPages上のJSを参照します。

緑の旗で毎回入力から結果を生成します。停止してから再実行できます。

切戻しはサンプル・READMEリンク・Pages配信設定の追加をrevertします。
