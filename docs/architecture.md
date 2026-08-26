# Architecture

[日本語](architecture.ja.md)

## Model

Markdown is represented as immutable fragments:

```text
MarkdownFragment
  -> inline(text, bold, italic, link, code)
  -> block(heading, paragraph, quote, codeBlock, list, listItem)
  -> sequence(children)
  -> empty
```

Builder operations return new fragment values. Rendering is the only operation that produces final Markdown text.

## Safety Policy

Plain text escapes Markdown metacharacters so user strings are not interpreted as raw Markdown. Inline code and fenced code blocks choose deterministic delimiters. Link destinations reject executable URL schemes such as `javascript:`.

There is no raw Markdown block in v1.

## TurboWarp Boundary

Reporter blocks serialize fragments with a `turbowarp-markdown:v1:` prefix. Plain strings passed into content arguments are treated as text fragments.

## Build Outputs

```text
src/index.ts + src/extension.ts + src/markdown.ts
  -> vite-plugin-turbowarp-extension
  -> dist/turbowarp-markdown.js

src/config.ts + src/block-definitions.json
  -> extension-api-manifest Vite plugin
  -> dist/extension-manifest.json
```
