# TurboWarp Markdown Builder

`@kubohiroya/turbowarp-markdown` provides immutable Builder-pattern-style Markdown fragments for TurboWarp and TypeScript.

## TurboWarp model

Blocks create opaque fragment handles. Fragments can be nested and chained, then rendered only at the output boundary:

```text
heading 1 (text "Sensor")
  followed by paragraph (text "24 °C")
  -> render Markdown
```

Result:

```markdown
# Sensor

24 °C
```

Ordinary text is escaped and is never interpreted as raw Markdown. The initial version intentionally has no raw-Markdown injection block.

## TypeScript API

```ts
import {append, heading, paragraph, renderMarkdown, text} from '@kubohiroya/turbowarp-markdown/core';

const document = append(
  heading(1, text('Sensor')),
  paragraph(text('24 °C')),
);

console.log(renderMarkdown(document));
```

## HTTP response example

The package is intentionally independent of `turbowarp-http-server`. Render the fragment to a string and return it with:

```text
Content-Type: text/markdown; charset=utf-8
```

## Security

Plain text and link destinations are escaped for their Markdown contexts. Raw Markdown is not supported by the ordinary builder API.

## License

MPL-2.0
