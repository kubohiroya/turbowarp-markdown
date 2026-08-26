# TurboWarp Markdown

[English](README.md)

TurboWarp 上で Markdown を immutable な構造化フラグメントとして組み立て、最後の出力境界でだけ Markdown 文字列へレンダリングする拡張です。

## 概要

- エスケープ済み text、bold、italic、link、inline code を作れます。
- heading、paragraph、quote、fenced code block、ordered/unordered list を作れます。
- 合成は入力を変更せず、新しいフラグメントを返します。
- CommonMark 寄りの Markdown を決定的にレンダリングします。
- ブロックなしで使える TypeScript composition API も `src/markdown.ts` から提供します。

## HTTP Server 連携

`turbowarp-http-server` とは npm パッケージ依存では結合しません。Markdown 拡張で作ったフラグメントを `render Markdown` で文字列化し、HTTP レスポンス本文として渡してください。content type は `text/markdown; charset=utf-8` を明示する想定です。

## 開発

```bash
corepack enable
pnpm install --frozen-lockfile
pnpm run check
```

## ライセンス

SPDX-License-Identifier: MPL-2.0
