import {
  append,
  bold,
  code,
  codeBlock,
  heading,
  italic,
  link,
  paragraph,
  quote,
  renderMarkdown,
  text,
  type MarkdownFragment,
} from './core.js';

const PREFIX = 'md:';

class FragmentRegistry {
  private nextId = 1;
  private readonly values = new Map<string, MarkdownFragment>();

  put(value: MarkdownFragment): string {
    const id = `${PREFIX}${this.nextId++}`;
    this.values.set(id, value);
    return id;
  }

  get(value: unknown): MarkdownFragment {
    const key = String(value ?? '');
    const fragment = this.values.get(key);
    if (fragment) return fragment;
    return text(key);
  }
}

class MarkdownExtension {
  private readonly registry = new FragmentRegistry();

  getInfo() {
    return {
      id: 'kubohiroyamarkdown',
      name: 'Markdown Builder',
      docsURI: 'https://kubohiroya.github.io/turbowarp-markdown/',
      blockIconURI: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCI+PHJlY3Qgd2lkdGg9IjI0IiBoZWlnaHQ9IjI0IiByeD0iNCIgZmlsbD0iIzU1NSIvPjx0ZXh0IHg9IjEyIiB5PSIxNiIgZm9udC1zaXplPSIxMCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0id2hpdGUiPk3ihpM8L3RleHQ+PC9zdmc+',
      blocks: [
        {opcode: 'text', blockType: Scratch.BlockType.REPORTER, text: 'text [TEXT]', arguments: {TEXT: {type: Scratch.ArgumentType.STRING, defaultValue: 'hello'}}},
        {opcode: 'bold', blockType: Scratch.BlockType.REPORTER, text: 'bold [CONTENT]', arguments: {CONTENT: {type: Scratch.ArgumentType.STRING, defaultValue: 'hello'}}},
        {opcode: 'italic', blockType: Scratch.BlockType.REPORTER, text: 'italic [CONTENT]', arguments: {CONTENT: {type: Scratch.ArgumentType.STRING, defaultValue: 'hello'}}},
        {opcode: 'link', blockType: Scratch.BlockType.REPORTER, text: 'link [CONTENT] URL [URL]', arguments: {CONTENT: {type: Scratch.ArgumentType.STRING, defaultValue: 'OpenAI'}, URL: {type: Scratch.ArgumentType.STRING, defaultValue: 'https://example.com/'}}},
        {opcode: 'code', blockType: Scratch.BlockType.REPORTER, text: 'code [TEXT]', arguments: {TEXT: {type: Scratch.ArgumentType.STRING, defaultValue: 'value'}}},
        {opcode: 'heading', blockType: Scratch.BlockType.REPORTER, text: 'heading [LEVEL] [CONTENT]', arguments: {LEVEL: {type: Scratch.ArgumentType.NUMBER, defaultValue: 1}, CONTENT: {type: Scratch.ArgumentType.STRING, defaultValue: 'Title'}}},
        {opcode: 'paragraph', blockType: Scratch.BlockType.REPORTER, text: 'paragraph [CONTENT]', arguments: {CONTENT: {type: Scratch.ArgumentType.STRING, defaultValue: 'Hello'}}},
        {opcode: 'quote', blockType: Scratch.BlockType.REPORTER, text: 'quote [CONTENT]', arguments: {CONTENT: {type: Scratch.ArgumentType.STRING, defaultValue: 'Quote'}}},
        {opcode: 'codeBlock', blockType: Scratch.BlockType.REPORTER, text: 'code block [TEXT] language [LANGUAGE]', arguments: {TEXT: {type: Scratch.ArgumentType.STRING, defaultValue: 'console.log("hello")'}, LANGUAGE: {type: Scratch.ArgumentType.STRING, defaultValue: 'javascript'}}},
        {opcode: 'append', blockType: Scratch.BlockType.REPORTER, text: '[A] followed by [B]', arguments: {A: {type: Scratch.ArgumentType.STRING, defaultValue: ''}, B: {type: Scratch.ArgumentType.STRING, defaultValue: ''}}},
        {opcode: 'render', blockType: Scratch.BlockType.REPORTER, text: 'render Markdown [CONTENT]', arguments: {CONTENT: {type: Scratch.ArgumentType.STRING, defaultValue: ''}}},
      ],
    };
  }

  text(args: {TEXT: unknown}) { return this.registry.put(text(args.TEXT)); }
  bold(args: {CONTENT: unknown}) { return this.registry.put(bold(this.registry.get(args.CONTENT))); }
  italic(args: {CONTENT: unknown}) { return this.registry.put(italic(this.registry.get(args.CONTENT))); }
  link(args: {CONTENT: unknown; URL: unknown}) { return this.registry.put(link(this.registry.get(args.CONTENT), args.URL)); }
  code(args: {TEXT: unknown}) { return this.registry.put(code(args.TEXT)); }
  heading(args: {LEVEL: unknown; CONTENT: unknown}) { return this.registry.put(heading(args.LEVEL, this.registry.get(args.CONTENT))); }
  paragraph(args: {CONTENT: unknown}) { return this.registry.put(paragraph(this.registry.get(args.CONTENT))); }
  quote(args: {CONTENT: unknown}) { return this.registry.put(quote(this.registry.get(args.CONTENT))); }
  codeBlock(args: {TEXT: unknown; LANGUAGE: unknown}) { return this.registry.put(codeBlock(args.TEXT, args.LANGUAGE)); }
  append(args: {A: unknown; B: unknown}) { return this.registry.put(append(this.registry.get(args.A), this.registry.get(args.B))); }
  render(args: {CONTENT: unknown}) { return renderMarkdown(this.registry.get(args.CONTENT)); }
}

if (!Scratch.extensions.unsandboxed) throw new Error('Markdown Builder must run unsandboxed.');
Scratch.extensions.register(new MarkdownExtension());
