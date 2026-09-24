# TurboWarp Markdown

[日本語](README.ja.md)

A TurboWarp extension for building Markdown as immutable structured fragments and rendering it only at the output boundary.

## What it does

- creates escaped inline text, bold, italic, links, and code spans;
- creates headings, paragraphs, quotes, fenced code blocks, and ordered/unordered lists;
- composes fragments functionally without mutating either input;
- renders deterministic CommonMark-style Markdown text;
- offers separate Markdown render blocks with and without validation;
- exports a block-free TypeScript composition API from `src/markdown.ts`.

## Requirements and safety

- Node.js 22 or newer;
- pnpm through Corepack;
- TurboWarp's unsandboxed extension option is not required.

Plain text is escaped instead of treated as raw Markdown. The initial version intentionally has no raw Markdown block. Link destinations use a conservative URL policy and reject executable schemes such as `javascript:`.

## Installation

```bash
corepack enable
pnpm install --frozen-lockfile
```

The package is version-pinned when used from npm:

```bash
pnpm add --save-exact @kubohiroya/turbowarp-markdown@0.2.0
```

## Quick Start

```ts
import {code, concat, heading, paragraph, render, text} from '@kubohiroya/turbowarp-markdown';

const document = concat(heading(1, 'Sensor'), paragraph(concat(text('temperature: '), code('21C'))));
const responseBody = render(document);
```

For `turbowarp-http-server`, pass the rendered string as the response body and select `Content-Type: text/markdown; charset=utf-8`. The HTTP server does not need a package dependency on this extension.

## Block reference

<!-- BEGIN GENERATED BLOCKS -->

### `text [TEXT]`

Creates escaped Markdown text.

| Property | Value |
|---|---|
| Type | Reporter |
| Opcode | `text` |
| `TEXT` | String, default: `Hello *world*` |

### `bold [CONTENT]`

Creates bold inline Markdown content.

| Property | Value |
|---|---|
| Type | Reporter |
| Opcode | `bold` |
| `CONTENT` | String, default: `important` |

### `italic [CONTENT]`

Creates italic inline Markdown content.

| Property | Value |
|---|---|
| Type | Reporter |
| Opcode | `italic` |
| `CONTENT` | String, default: `note` |

### `link [CONTENT] URL [URL]`

Creates a Markdown link with a conservatively validated destination.

| Property | Value |
|---|---|
| Type | Reporter |
| Opcode | `link` |
| `CONTENT` | String, default: `TurboWarp` |
| `URL` | String, default: `https://turbowarp.org/` |

### `code [TEXT]`

Creates inline code content.

| Property | Value |
|---|---|
| Type | Reporter |
| Opcode | `code` |
| `TEXT` | String, default: `status` |

### `heading [LEVEL] [CONTENT]`

Creates a heading with the level clamped to 1 through 6.

| Property | Value |
|---|---|
| Type | Reporter |
| Opcode | `heading` |
| `LEVEL` | Number, default: `1` |
| `CONTENT` | String, default: `Sensor` |

### `paragraph [CONTENT]`

Creates a paragraph block.

| Property | Value |
|---|---|
| Type | Reporter |
| Opcode | `paragraph` |
| `CONTENT` | String, default: `ready` |

### `quote [CONTENT]`

Creates a block quote.

| Property | Value |
|---|---|
| Type | Reporter |
| Opcode | `quote` |
| `CONTENT` | String, default: `quoted` |

### `code block [TEXT] language [LANGUAGE]`

Creates a fenced code block.

| Property | Value |
|---|---|
| Type | Reporter |
| Opcode | `codeBlock` |
| `TEXT` | String, default: `console.log('ok')` |
| `LANGUAGE` | String, default: `js` |

### `list item [CONTENT]`

Creates a list item fragment.

| Property | Value |
|---|---|
| Type | Reporter |
| Opcode | `listItem` |
| `CONTENT` | String, default: `item` |

### `unordered list [ITEMS]`

Creates an unordered list from item fragments.

| Property | Value |
|---|---|
| Type | Reporter |
| Opcode | `unorderedList` |
| `ITEMS` | String, default: `` |

### `ordered list [ITEMS]`

Creates an ordered list from item fragments.

| Property | Value |
|---|---|
| Type | Reporter |
| Opcode | `orderedList` |
| `ITEMS` | String, default: `` |

### `[LEFT] followed by [RIGHT]`

Creates a new Markdown fragment sequence without mutating either input.

| Property | Value |
|---|---|
| Type | Reporter |
| Opcode | `concat` |
| `LEFT` | String, default: `` |
| `RIGHT` | String, default: `` |

### `render Markdown [FRAGMENT]`

Renders a Markdown fragment to final Markdown text without updating stored validation errors.

| Property | Value |
|---|---|
| Type | Reporter |
| Opcode | `render` |
| `FRAGMENT` | String, default: `` |

### `render Markdown with validation [FRAGMENT]`

Validates a Markdown fragment, stores any validation errors, and renders final Markdown text.

| Property | Value |
|---|---|
| Type | Reporter |
| Opcode | `renderWithValidation` |
| `FRAGMENT` | String, default: `` |

### `last Markdown validation errors`

Returns validation errors stored by the most recent render Markdown with validation block.

| Property | Value |
|---|---|
| Type | Reporter |
| Opcode | `lastValidationErrors` |

### `last rendered Markdown has validation errors?`

Reports whether the most recent validated Markdown render stored validation errors.

| Property | Value |
|---|---|
| Type | Boolean |
| Opcode | `lastRenderHasValidationErrors` |

### `validate Markdown [FRAGMENT]`

Returns simple validation diagnostics for a Markdown fragment.

| Property | Value |
|---|---|
| Type | Reporter |
| Opcode | `validateMarkdown` |
| `FRAGMENT` | String, default: `` |

### `Markdown [FRAGMENT] is valid?`

Reports whether simple validation found no Markdown errors.

| Property | Value |
|---|---|
| Type | Boolean |
| Opcode | `isValidMarkdown` |
| `FRAGMENT` | String, default: `` |

<!-- END GENERATED BLOCKS -->

## Important behavior

Scratch reporter blocks exchange opaque `turbowarp-markdown:v1:` values while builder blocks are chained. Ordinary strings passed into content positions become escaped text fragments. The final Markdown string is produced only by `render Markdown [FRAGMENT]`.

The TypeScript API exposes inline builders, block builders, list helpers, `concat`, `render`, `renderWithValidation`, and `validate`. All builder functions return new values and do not mutate their inputs.

Use `render Markdown [FRAGMENT]` when validation is not needed. Use `render Markdown with validation [FRAGMENT]` when the final Builder-pattern output should also run validation and store validation errors from that render. Other extensions can read those errors with `last Markdown validation errors` or check `last rendered Markdown has validation errors?` after rendering. This lets an HTTP extension choose to return an explanatory error response and log the same diagnostics.

Validation is intentionally lightweight. It catches common mistakes such as a `list item` used outside a list and block fragments nested inside inline-only fragments. It also warns about empty documents, empty lists, empty headings, and links without visible content or destinations.

## Development

```bash
pnpm run check
```

The check runs type checking, linting, tests, generated README validation, `dist/` reproducibility, repository policy validation, and an npm package dry run.

## Release

Keep `package.json` as the version source of truth. Before publishing, run:

```bash
pnpm run check
npm pack --dry-run --ignore-scripts
```

Release artifacts include `dist/turbowarp-markdown.js`, `dist/extension-manifest.json`, `README.md`, `README.ja.md`, and `LICENSE`.

## License

SPDX-License-Identifier: MPL-2.0
