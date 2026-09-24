import {describe, expect, it} from 'vitest';
import {
  bold,
  code,
  codeBlock,
  concat,
  empty,
  formatValidationResult,
  getLastRenderValidationErrorText,
  getLastRenderValidationErrors,
  getLastRenderValidationResult,
  heading,
  italic,
  isValid,
  link,
  listItem,
  orderedList,
  paragraph,
  quote,
  render,
  renderWithValidation,
  text,
  unorderedList,
  validate
} from '../src/markdown.js';

describe('Markdown builder API', () => {
  it('escapes plain text and preserves Unicode', () => {
    expect(render(text('5 * 7 [雨] <ok>'))).toBe('5 \\* 7 \\[雨\\] \\<ok\\>');
  });

  it('renders inline fragments deterministically', () => {
    const fragment = concat(bold('hot'), concat(text(' and '), italic(code('ready'))));
    expect(render(fragment)).toBe('**hot** and *`ready`*');
  });

  it('renders representative documents with block spacing', () => {
    const document = concat(heading(1, 'Sensor'), paragraph(concat(text('temperature: '), code('21C'))));
    expect(render(document)).toBe('# Sensor\n\ntemperature: `21C`');
  });

  it('builds unordered and ordered lists from immutable item fragments', () => {
    const items = concat(listItem('one'), listItem(link('two', '/two')));
    expect(render(unorderedList(items))).toBe('- one\n- [two](/two)');
    expect(render(orderedList(items))).toBe('1. one\n2. [two](/two)');
  });

  it('renders empty fragments explicitly at the output boundary', () => {
    expect(render(empty)).toBe('');
    expect(render(concat(empty, empty))).toBe('');
    expect(render(unorderedList(empty))).toBe('');
  });

  it('renders quotes and fenced code blocks safely', () => {
    expect(render(quote(paragraph('quoted')))).toBe('> quoted');
    expect(render(codeBlock('const fence = ```;', 'ts!'))).toBe(
      '````ts\nconst fence = ```;\n````'
    );
  });

  it('clamps heading levels and rejects executable URLs', () => {
    expect(render(heading(9, 'deep'))).toBe('###### deep');
    expect(() => link('bad', 'javascript:alert(1)')).toThrow('Unsafe URL value');
  });

  it('validates common successful structures', () => {
    const document = concat(heading(1, 'Sensor'), paragraph('ready'));
    expect(validate(document)).toEqual({valid: true, issues: []});
    expect(isValid(unorderedList(concat(listItem('one'), listItem('two'))))).toBe(true);
  });

  it('reports validation errors for structural mistakes', () => {
    const result = validate(concat(listItem('orphan'), bold(paragraph('block in inline'))));
    expect(result.valid).toBe(false);
    expect(result.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          severity: 'error',
          message: 'listItem must be inside a list.'
        }),
        expect.objectContaining({
          severity: 'error',
          message: 'paragraph cannot be nested inside bold.'
        })
      ])
    );
  });

  it('keeps warning-only validation results valid', () => {
    const result = validate(unorderedList(empty));
    expect(result.valid).toBe(true);
    expect(formatValidationResult(result)).toContain('warning: $: list should contain at least one item.');
  });

  it('stores validation errors only for validated renders', () => {
    renderWithValidation(unorderedList(empty));
    expect(getLastRenderValidationResult().valid).toBe(true);
    expect(getLastRenderValidationErrors()).toEqual([]);
    expect(getLastRenderValidationErrorText()).toBe('');

    render(listItem('orphan'));
    expect(getLastRenderValidationResult().valid).toBe(true);
    expect(getLastRenderValidationErrors()).toEqual([]);

    renderWithValidation(listItem('orphan'));
    expect(getLastRenderValidationResult().valid).toBe(false);
    expect(getLastRenderValidationErrorText()).toBe('$: listItem must be inside a list.');
  });
});
