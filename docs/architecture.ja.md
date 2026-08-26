# アーキテクチャ

[English](architecture.md)

## モデル

Markdown は immutable な inline、block、sequence、empty フラグメントとして表現します。builder 操作は入力を変更せず、新しい値を返します。Markdown 文字列は `render` でのみ生成します。

## 安全方針

通常 text は Markdown 構文文字をエスケープし、ユーザー文字列を raw Markdown として解釈しません。inline code と fenced code block は決定的な delimiter を選びます。link destination は `javascript:` などの実行可能 URL scheme を拒否します。raw Markdown ブロックは v1 では提供しません。

## TurboWarp 境界

reporter block 間では `turbowarp-markdown:v1:` 接頭辞付きの値を渡します。content 引数に通常文字列が渡された場合は text fragment として扱います。
