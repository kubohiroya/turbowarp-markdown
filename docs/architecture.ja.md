# アーキテクチャ

[English](architecture.md)

## モデル

Markdown は immutable な inline、block、sequence、empty フラグメントとして表現します。builder 操作は入力を変更せず、新しい値を返します。Markdown 文字列は `render` でのみ生成します。

## 安全方針

通常 text は Markdown 構文文字をエスケープし、ユーザー文字列を raw Markdown として解釈しません。inline code と fenced code block は決定的な delimiter を選びます。link destination は `javascript:` などの実行可能 URL scheme を拒否します。raw Markdown ブロックは v1 では提供しません。

## バリデーション

validator は軽量なツリーチェックです。`render Markdown [FRAGMENT]` は validation なしでレンダリングします。`render Markdown with validation [FRAGMENT]` はレンダリング前に validation を実行し、直近の validated render の validation 結果を保持します。保持された error 文字列は `last Markdown validation errors`、boolean 状態は `last rendered Markdown has validation errors?` から取得できます。

これは HTTP レスポンス処理との連携点です。server 拡張は validation 付き render ブロックを使い、その後で保持済み error を確認し、必要ならレスポンス本文を説明付きエラーページに差し替え、同じ診断をログに出せます。

`listItem` が list の外にある場合や、inline 専用フラグメントの中に block fragment が入る場合は error として報告します。空フラグメント、空 list、空 heading、表示内容や URL のない link などは warning として報告します。完全な CommonMark conformance checker の代替ではありません。

## TurboWarp 境界

reporter block 間では `turbowarp-markdown:v1:` 接頭辞付きの値を渡します。content 引数に通常文字列が渡された場合は text fragment として扱います。
