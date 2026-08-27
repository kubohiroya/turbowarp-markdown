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

## Validation

The validator is a lightweight tree check. `render Markdown [FRAGMENT]` renders without validation. `render Markdown with validation [FRAGMENT]` runs validation before rendering and stores the validation result from the most recent validated render. The stored error text is available through `last Markdown validation errors`, and the boolean state is available through `last rendered Markdown has validation errors?`.

This is intended as the integration point for HTTP response handling: a server extension can use the validated render block, inspect the stored validation errors, and replace the response body with an explanatory error page while logging the same diagnostics.

The validator reports errors for issues that make the generated Markdown structure clearly wrong, such as `listItem` outside a list and block fragments nested inside inline-only fragments. It reports warnings for likely authoring problems such as empty fragments, empty lists, empty headings, and links without visible content or destinations.

Validation does not replace a full CommonMark conformance checker.

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
