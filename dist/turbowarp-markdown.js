// Name: TurboWarp Markdown
// ID: kubohiroyamarkdown
// Description: Build Markdown documents with immutable reporter blocks.
// By: Hiroya Kubo
// License: MPL-2.0

(function (Scratch) {
  'use strict';

  const extensionConfig = {
    id: "kubohiroyamarkdown",
    docsURI: "https://kubohiroya.github.io/turbowarp-markdown/",
    blockIconURI: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA0OCA0OCI+PHJlY3QgeD0iNiIgeT0iOCIgd2lkdGg9IjM2IiBoZWlnaHQ9IjMyIiByeD0iNCIgZmlsbD0iIzJGNjM4NiIvPjxwYXRoIGQ9Ik0xMyAzMFYxOGw1IDcgNS03djEyTTMwIDE4djEyTTI2IDMwaDgiIGZpbGw9Im5vbmUiIHN0cm9rZT0iI2ZmZmZmZiIgc3Ryb2tlLXdpZHRoPSIzIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz48L3N2Zz4="
  };
  const extensionName = "TurboWarp Markdown";
  const blocks = [{ "opcode": "text", "blockType": "REPORTER", "text": "text [TEXT]", "description": "Creates escaped Markdown text.", "arguments": { "TEXT": { "type": "STRING", "defaultValue": "Hello *world*" } } }, { "opcode": "bold", "blockType": "REPORTER", "text": "bold [CONTENT]", "description": "Creates bold inline Markdown content.", "arguments": { "CONTENT": { "type": "STRING", "defaultValue": "important" } } }, { "opcode": "italic", "blockType": "REPORTER", "text": "italic [CONTENT]", "description": "Creates italic inline Markdown content.", "arguments": { "CONTENT": { "type": "STRING", "defaultValue": "note" } } }, { "opcode": "link", "blockType": "REPORTER", "text": "link [CONTENT] URL [URL]", "description": "Creates a Markdown link with a conservatively validated destination.", "arguments": { "CONTENT": { "type": "STRING", "defaultValue": "TurboWarp" }, "URL": { "type": "STRING", "defaultValue": "https://turbowarp.org/" } } }, { "opcode": "code", "blockType": "REPORTER", "text": "code [TEXT]", "description": "Creates inline code content.", "arguments": { "TEXT": { "type": "STRING", "defaultValue": "status" } } }, { "opcode": "heading", "blockType": "REPORTER", "text": "heading [LEVEL] [CONTENT]", "description": "Creates a heading with the level clamped to 1 through 6.", "arguments": { "LEVEL": { "type": "NUMBER", "defaultValue": 1 }, "CONTENT": { "type": "STRING", "defaultValue": "Sensor" } } }, { "opcode": "paragraph", "blockType": "REPORTER", "text": "paragraph [CONTENT]", "description": "Creates a paragraph block.", "arguments": { "CONTENT": { "type": "STRING", "defaultValue": "ready" } } }, { "opcode": "quote", "blockType": "REPORTER", "text": "quote [CONTENT]", "description": "Creates a block quote.", "arguments": { "CONTENT": { "type": "STRING", "defaultValue": "quoted" } } }, { "opcode": "codeBlock", "blockType": "REPORTER", "text": "code block [TEXT] language [LANGUAGE]", "description": "Creates a fenced code block.", "arguments": { "TEXT": { "type": "STRING", "defaultValue": "console.log('ok')" }, "LANGUAGE": { "type": "STRING", "defaultValue": "js" } } }, { "opcode": "listItem", "blockType": "REPORTER", "text": "list item [CONTENT]", "description": "Creates a list item fragment.", "arguments": { "CONTENT": { "type": "STRING", "defaultValue": "item" } } }, { "opcode": "unorderedList", "blockType": "REPORTER", "text": "unordered list [ITEMS]", "description": "Creates an unordered list from item fragments.", "arguments": { "ITEMS": { "type": "STRING", "defaultValue": "" } } }, { "opcode": "orderedList", "blockType": "REPORTER", "text": "ordered list [ITEMS]", "description": "Creates an ordered list from item fragments.", "arguments": { "ITEMS": { "type": "STRING", "defaultValue": "" } } }, { "opcode": "concat", "blockType": "REPORTER", "text": "[LEFT] followed by [RIGHT]", "description": "Creates a new Markdown fragment sequence without mutating either input.", "arguments": { "LEFT": { "type": "STRING", "defaultValue": "" }, "RIGHT": { "type": "STRING", "defaultValue": "" } } }, { "opcode": "render", "blockType": "REPORTER", "text": "render Markdown [FRAGMENT]", "description": "Renders a Markdown fragment to final Markdown text.", "arguments": { "FRAGMENT": { "type": "STRING", "defaultValue": "" } } }];
  const definitions = {
    extensionName,
    blocks
  };
  const empty = { kind: "empty" };
  const SAFE_URL_PATTERN = /^(?:https?:|mailto:|tel:|\/|\.\/|\.\.\/|#|\?|$)/iu;
  function text(value) {
    return { kind: "text", value };
  }
  function bold(content) {
    return { kind: "bold", content: normalizeContent(content) };
  }
  function italic(content) {
    return { kind: "italic", content: normalizeContent(content) };
  }
  function link(content, url) {
    validateSafeUrl(url);
    return { kind: "link", content: normalizeContent(content), url };
  }
  function code(value) {
    return { kind: "code", value };
  }
  function heading(level, content) {
    return { kind: "heading", level: clampHeadingLevel(level), content: normalizeContent(content) };
  }
  function paragraph(content) {
    return { kind: "paragraph", content: normalizeContent(content) };
  }
  function quote(content) {
    return { kind: "quote", content: normalizeContent(content) };
  }
  function codeBlock(value, language = "") {
    return { kind: "codeBlock", language: sanitizeLanguage(language), value };
  }
  function listItem(content) {
    return { kind: "listItem", content: normalizeContent(content) };
  }
  function unorderedList(items) {
    return { kind: "list", ordered: false, items: normalizeItems(items) };
  }
  function orderedList(items) {
    return { kind: "list", ordered: true, items: normalizeItems(items) };
  }
  function concat(left, right) {
    const children = [...flattenSequence(left), ...flattenSequence(right)].filter(
      (child) => child.kind !== "empty"
    );
    if (children.length === 0) return empty;
    if (children.length === 1) return children[0] ?? empty;
    return { kind: "sequence", children };
  }
  function render(fragment) {
    return renderDocument(fragment);
  }
  function normalizeContent(content) {
    return typeof content === "string" ? text(content) : content;
  }
  function renderDocument(fragment) {
    if (fragment.kind === "empty") return "";
    if (fragment.kind === "sequence") {
      if (fragment.children.every((child) => isInline(child) || child.kind === "sequence")) {
        return renderInline(fragment);
      }
      return fragment.children.map(renderDocument).filter(Boolean).join("\n\n");
    }
    if (isInline(fragment)) return renderInline(fragment);
    return renderBlock(fragment);
  }
  function renderBlock(fragment) {
    switch (fragment.kind) {
      case "heading":
        return `${"#".repeat(fragment.level)} ${renderInlineish(fragment.content)}`;
      case "paragraph":
        return renderInlineish(fragment.content);
      case "quote":
        return renderDocument(fragment.content).split("\n").map((line) => line.length === 0 ? ">" : `> ${line}`).join("\n");
      case "codeBlock":
        return renderCodeBlock(fragment);
      case "list":
        return fragment.items.map((item, index) => renderListItem(item, fragment.ordered ? `${index + 1}.` : "-")).join("\n");
      case "listItem":
        return renderInlineish(fragment.content);
      default:
        return renderDocument(fragment);
    }
  }
  function renderInline(fragment) {
    switch (fragment.kind) {
      case "text":
        return escapeMarkdownText(fragment.value);
      case "bold":
        return `**${renderInlineish(fragment.content)}**`;
      case "italic":
        return `*${renderInlineish(fragment.content)}*`;
      case "link":
        return `[${renderInlineish(fragment.content)}](${escapeUrl(fragment.url)})`;
      case "code":
        return renderInlineCode(fragment.value);
      case "sequence":
        return fragment.children.map(renderInlineish).join("");
      case "empty":
        return "";
      default:
        return renderBlock(fragment);
    }
  }
  function renderInlineish(fragment) {
    return isInline(fragment) || fragment.kind === "sequence" ? renderInline(fragment) : renderBlock(fragment);
  }
  function renderCodeBlock(fragment) {
    const fence = longestBacktickRun(fragment.value) >= 3 ? "````" : "```";
    const language = fragment.language.length > 0 ? fragment.language : "";
    return `${fence}${language}
  ${fragment.value}
  ${fence}`;
  }
  function renderInlineCode(value) {
    const fence = "`".repeat(Math.max(1, longestBacktickRun(value) + 1));
    const needsPadding = value.startsWith("`") || value.endsWith("`") || value.includes("\n");
    const content = needsPadding ? ` ${value} ` : value;
    return `${fence}${content}${fence}`;
  }
  function renderListItem(fragment, marker) {
    const content = fragment.kind === "listItem" ? fragment.content : fragment;
    const rendered = renderDocument(content);
    const [first = "", ...rest] = rendered.split("\n");
    const padding = " ".repeat(marker.length + 1);
    return [`${marker} ${first}`, ...rest.map((line) => `${padding}${line}`)].join("\n");
  }
  function normalizeItems(items) {
    const fragment = normalizeContent(items);
    if (fragment.kind === "sequence") return fragment.children;
    if (fragment.kind === "empty") return [];
    return [fragment];
  }
  function flattenSequence(fragment) {
    if (fragment.kind === "sequence") return fragment.children.flatMap(flattenSequence);
    return [fragment];
  }
  function isInline(fragment) {
    return ["text", "bold", "italic", "link", "code", "empty"].includes(fragment.kind);
  }
  function clampHeadingLevel(level) {
    if (!Number.isFinite(level)) return 1;
    return Math.min(6, Math.max(1, Math.trunc(level)));
  }
  function sanitizeLanguage(language) {
    return language.trim().replace(/[^a-zA-Z0-9_+.-]/gu, "");
  }
  function validateSafeUrl(value) {
    const trimmed = value.trim();
    if (!SAFE_URL_PATTERN.test(trimmed)) {
      throw new TypeError(`Unsafe URL value: ${value}`);
    }
  }
  function escapeMarkdownText(value) {
    return value.replace(/([\\`*_{}[\]()#+\-.!<>|])/gu, "\\$1");
  }
  function escapeUrl(value) {
    return value.trim().replace(/\)/gu, "%29").replace(/\s/gu, "%20");
  }
  function longestBacktickRun(value) {
    return Math.max(0, ...Array.from(value.matchAll(/`+/gu), (match) => match[0]?.length ?? 0));
  }
  const SERIALIZED_PREFIX = "turbowarp-markdown:v1:";
  const blockDefinitions = definitions.blocks;
  class MarkdownExtension {
    getInfo() {
      return {
        id: extensionConfig.id,
        name: Scratch.translate(definitions.extensionName),
        docsURI: extensionConfig.docsURI,
        blockIconURI: extensionConfig.blockIconURI,
        blocks: blockDefinitions.map((block) => this.toScratchBlock(block))
      };
    }
    text(args) {
      return encode(text(Scratch.Cast.toString(args.TEXT)));
    }
    bold(args) {
      return encode(bold(decodeOrText(args.CONTENT)));
    }
    italic(args) {
      return encode(italic(decodeOrText(args.CONTENT)));
    }
    link(args) {
      return encode(link(decodeOrText(args.CONTENT), Scratch.Cast.toString(args.URL)));
    }
    code(args) {
      return encode(code(Scratch.Cast.toString(args.TEXT)));
    }
    heading(args) {
      return encode(heading(Scratch.Cast.toNumber(args.LEVEL), decodeOrText(args.CONTENT)));
    }
    paragraph(args) {
      return encode(paragraph(decodeOrText(args.CONTENT)));
    }
    quote(args) {
      return encode(quote(decodeOrText(args.CONTENT)));
    }
    codeBlock(args) {
      return encode(codeBlock(Scratch.Cast.toString(args.TEXT), Scratch.Cast.toString(args.LANGUAGE)));
    }
    listItem(args) {
      return encode(listItem(decodeOrText(args.CONTENT)));
    }
    unorderedList(args) {
      return encode(unorderedList(decodeOrText(args.ITEMS)));
    }
    orderedList(args) {
      return encode(orderedList(decodeOrText(args.ITEMS)));
    }
    concat(args) {
      return encode(concat(decodeOrText(args.LEFT), decodeOrText(args.RIGHT)));
    }
    render(args) {
      return render(decodeOrText(args.FRAGMENT));
    }
    toScratchBlock(block) {
      return {
        opcode: block.opcode,
        blockType: Scratch.BlockType[block.blockType],
        text: Scratch.translate(block.text),
        arguments: Object.fromEntries(
          Object.entries(block.arguments).map(([name, argument]) => [
            name,
            {
              type: Scratch.ArgumentType[argument.type],
              defaultValue: argument.defaultValue
            }
          ])
        )
      };
    }
  }
  function encode(fragment) {
    return `${SERIALIZED_PREFIX}${JSON.stringify(fragment)}`;
  }
  function decodeOrText(value) {
    const raw = Scratch.Cast.toString(value);
    if (!raw.startsWith(SERIALIZED_PREFIX)) return text(raw);
    return parseFragment(raw.slice(SERIALIZED_PREFIX.length));
  }
  function parseFragment(json) {
    const parsed = JSON.parse(json);
    if (!isFragment(parsed)) throw new TypeError("Invalid serialized Markdown fragment.");
    return parsed;
  }
  function isFragment(value) {
    if (typeof value !== "object" || value === null) return false;
    const record = value;
    if (record.kind === "empty") return true;
    if (record.kind === "text" || record.kind === "code") return typeof record.value === "string";
    if (record.kind === "bold" || record.kind === "italic" || record.kind === "paragraph") {
      return isFragment(record.content);
    }
    if (record.kind === "link") {
      return typeof record.url === "string" && isFragment(record.content);
    }
    if (record.kind === "heading") {
      return typeof record.level === "number" && isFragment(record.content);
    }
    if (record.kind === "quote" || record.kind === "listItem") return isFragment(record.content);
    if (record.kind === "codeBlock") {
      return typeof record.language === "string" && typeof record.value === "string";
    }
    if (record.kind === "list") {
      return typeof record.ordered === "boolean" && Array.isArray(record.items) && record.items.every(isFragment);
    }
    if (record.kind === "sequence") return Array.isArray(record.children) && record.children.every(isFragment);
    return false;
  }
  Scratch.extensions.register(new MarkdownExtension());

})(Scratch);
