// Name: TurboWarp Markdown
// ID: kubohiroyamarkdown
// Description: Build Markdown documents with immutable reporter blocks.
// By: Hiroya Kubo
// License: MPL-2.0

(function (Scratch) {
  'use strict';

  //#region src/config.ts
  var extensionConfig = {
  	id: "kubohiroyamarkdown",
  	slug: "turbowarp-markdown",
  	name: "TurboWarp Markdown",
  	description: "Build Markdown documents with immutable reporter blocks.",
  	author: "Hiroya Kubo",
  	license: "MPL-2.0",
  	unsandboxed: false,
  	docsURI: "https://kubohiroya.github.io/turbowarp-markdown/",
  	blockIconURI: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA0OCA0OCI+PHJlY3QgeD0iNiIgeT0iOCIgd2lkdGg9IjM2IiBoZWlnaHQ9IjMyIiByeD0iNCIgZmlsbD0iIzJGNjM4NiIvPjxwYXRoIGQ9Ik0xMyAzMFYxOGw1IDcgNS03djEyTTMwIDE4djEyTTI2IDMwaDgiIGZpbGw9Im5vbmUiIHN0cm9rZT0iI2ZmZmZmZiIgc3Ryb2tlLXdpZHRoPSIzIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz48L3N2Zz4="
  };
  //#endregion
  //#region node_modules/.pnpm/@kubohiroya+turbowarp-extension-data-editor@0.2.1_react@18.3.1/node_modules/@kubohiroya/turbowarp-extension-data-editor/dist/fixed-input-schema.js
  var numberToken = /^-?(?:0|[1-9][0-9]*)(?:\.[0-9]+)?(?:[eE][+-]?[0-9]+)?$/u;
  var invalidNumber = Object.freeze({
  	kind: "invalid",
  	code: "fixed-number-input-invalid"
  });
  /**
  * Parse a NEW numeric draft according to NP-finite-new-input-v1.
  * Never apply this to opening/no-op raw values or use it as an owner validator.
  * Keep the validated token so negative zero, precision and exponent spelling survive.
  */
  function parseFixedNumberInput(input) {
  	if (typeof input === "number") {
  		if (!Number.isFinite(input)) return invalidNumber;
  		return Object.freeze({
  			kind: "valid",
  			token: Object.is(input, -0) ? "-0" : String(input),
  			value: input
  		});
  	}
  	if (typeof input !== "string") return invalidNumber;
  	const token = input.trim();
  	if (!numberToken.test(token)) return invalidNumber;
  	const value = Number(token);
  	return Number.isFinite(value) ? Object.freeze({
  		kind: "valid",
  		token,
  		value
  	}) : invalidNumber;
  }
  var block_editor_fixed_inputs_schema_default = {
  	$schema: "https://json-schema.org/draft/2020-12/schema",
  	$id: "https://kubohiroya.github.io/turbowarp-markdown/schemas/block-editor-fixed-inputs.schema.json",
  	$defs: { "heading": {
  		"type": "object",
  		"properties": { "LEVEL": { "type": "number" } },
  		"required": ["LEVEL"],
  		"additionalProperties": true
  	} }
  };
  //#endregion
  //#region src/fixed-input-schema.ts
  var repository$1 = "turbowarp-markdown";
  /** The owner JSON document is canonical; this selects a primitive field fragment. */
  function fixedInputBundle(opcode, argument) {
  	const source = {
  		repository: repository$1,
  		path: "schemas/block-editor-fixed-inputs.schema.json",
  		symbol: `#/$defs/${opcode}/properties/${argument}`
  	};
  	const blocks = block_editor_fixed_inputs_schema_default.$defs;
  	return {
  		identity: {
  			ownerId: repository$1,
  			contractId: opcode,
  			revision: "fixed-inputs-v1",
  			variantId: argument
  		},
  		dialect: "2020-12",
  		root: {
  			retrievalUri: block_editor_fixed_inputs_schema_default.$id,
  			document: blocks[opcode].properties[argument],
  			artifact: {
  				role: "canonical-schema",
  				source
  			}
  		},
  		resources: [],
  		provenance: {
  			canonicalSources: [source, {
  				repository: repository$1,
  				path: "src/extension.ts",
  				symbol: opcode
  			}],
  			generatedFiles: [],
  			referenceSchemas: [],
  			generationSources: []
  		}
  	};
  }
  //#endregion
  //#region src/fixed-input-editors.ts
  var extensionId = "kubohiroyamarkdown";
  var repository = "turbowarp-markdown";
  var fields = [{
  	"opcode": "heading",
  	"argument": "LEVEL",
  	"control": "number",
  	"choices": [],
  	"normalization": "identity",
  	"shape": "math_number.NUM",
  	"maxBytes": false
  }];
  function literalString(value) {
  	if (typeof value !== "string") throw new TypeError("Expected a string literal.");
  	return value;
  }
  /** Legacy nonempty finite aliases are projections; opening never creates a write. */
  function existingFixedNumber(value) {
  	if (typeof value !== "string" && typeof value !== "number" || typeof value === "string" && value.trim() === "") throw new TypeError("Unavailable numeric projection.");
  	const number = Number(value);
  	if (!Number.isFinite(number)) throw new TypeError("Unavailable numeric projection.");
  	return number;
  }
  function normalizeChoice(field, raw) {
  	if (field.normalization === "lowercase") return raw.toLowerCase();
  	if (field.normalization === "method") return raw.trim().toUpperCase();
  	if (field.normalization === "trim") return raw.trim();
  	if (field.normalization === "parse-format") {
  		const lower = raw.trim().toLowerCase();
  		return lower === "json" ? "JSON" : lower === "yaml" ? "YAML" : lower === "auto" ? "auto" : raw;
  	}
  	return raw;
  }
  function binding(field) {
  	return {
  		argument: field.argument,
  		schemaBundle: fixedInputBundle(field.opcode, field.argument),
  		control: {
  			kind: field.control,
  			...field.control === "enum" ? { choices: field.choices.map((value) => ({ value })) } : {}
  		},
  		read(value) {
  			return field.control === "number" ? existingFixedNumber(value) : normalizeChoice(field, literalString(value));
  		},
  		encode(value) {
  			if (field.control === "number") {
  				const parsed = parseFixedNumberInput(value);
  				if (parsed.kind !== "valid") throw new TypeError("Invalid new numeric input.");
  				return parsed.token;
  			}
  			const raw = literalString(value), normalized = normalizeChoice(field, raw);
  			if (!field.choices.includes(normalized)) throw new TypeError("Unsupported fixed choice.");
  			return field.shape === "menu-shadow" || field.shape === "direct-field-dropdown" ? normalized : raw;
  		},
  		validateCandidate(value) {
  			try {
  				if (field.control === "number") {
  					const number = existingFixedNumber(value);
  					if (field.maxBytes && (!Number.isSafeInteger(Math.trunc(number)) || Math.trunc(number) < 1)) return [{ message: "Invalid named body size." }];
  					return [];
  				}
  				return field.choices.includes(normalizeChoice(field, literalString(value))) ? [] : [{ message: "Unsupported fixed choice." }];
  			} catch {
  				return [{ message: "Invalid fixed input." }];
  			}
  		}
  	};
  }
  var fixedInputEditors = [...new Set(fields.map((f) => f.opcode))].map((opcode) => ({
  	apiVersion: 1,
  	extensionId,
  	editorId: `${opcode}-fixed-inputs`,
  	opcodes: [`${extensionId}_${opcode}`],
  	contractId: `${repository}/${opcode}`,
  	contractRevision: "fixed-inputs-v1",
  	bindings: fields.filter((field) => field.opcode === opcode).map(binding),
  	validationContext: () => ({
  		consumerId: repository,
  		nowMs: 0,
  		settings: null
  	})
  }));
  /** Registration follows the advertised opcode membership and the optional host capability. */
  function fixedInputRegistration(scratch) {
  	const host = scratch ?? {};
  	let active;
  	let membership = "";
  	const removers = [];
  	let stopped = false;
  	const clear = () => {
  		host.vm?.runtime?.off?.("RUNTIME_DISPOSED", shutdown);
  		for (const remove of removers.splice(0).reverse()) remove();
  		active = void 0;
  		membership = "";
  	};
  	const shutdown = () => {
  		stopped = true;
  		clear();
  	};
  	return {
  		ensure(visibleOpcodes) {
  			const api = host.gui?.blockEditors;
  			const definitions = fixedInputEditors.filter((definition) => definition.opcodes.every((opcode) => visibleOpcodes.includes(opcode)));
  			const key = definitions.map((definition) => definition.editorId).join(",");
  			if (stopped || api === active && membership === key) return;
  			clear();
  			if (api?.apiVersion !== 1 || typeof api.registerFixedInputEditor !== "function" || !definitions.length) return;
  			try {
  				for (const definition of definitions) {
  					const remove = api.registerFixedInputEditor.call(api, definition);
  					if (typeof remove !== "function") throw new TypeError("Invalid fixed input cleanup.");
  					removers.push(remove);
  				}
  				active = api;
  				membership = key;
  				host.vm?.runtime?.on?.("RUNTIME_DISPOSED", shutdown);
  			} catch (error) {
  				clear();
  				throw error;
  			}
  		},
  		dispose: shutdown
  	};
  }
  var block_definitions_default = {
  	extensionName: "TurboWarp Markdown",
  	blocks: [
  		{
  			"opcode": "text",
  			"blockType": "REPORTER",
  			"text": "text [TEXT]",
  			"description": "Creates escaped Markdown text.",
  			"arguments": { "TEXT": {
  				"type": "STRING",
  				"defaultValue": "Hello *world*"
  			} }
  		},
  		{
  			"opcode": "bold",
  			"blockType": "REPORTER",
  			"text": "bold [CONTENT]",
  			"description": "Creates bold inline Markdown content.",
  			"arguments": { "CONTENT": {
  				"type": "STRING",
  				"defaultValue": "important"
  			} }
  		},
  		{
  			"opcode": "italic",
  			"blockType": "REPORTER",
  			"text": "italic [CONTENT]",
  			"description": "Creates italic inline Markdown content.",
  			"arguments": { "CONTENT": {
  				"type": "STRING",
  				"defaultValue": "note"
  			} }
  		},
  		{
  			"opcode": "link",
  			"blockType": "REPORTER",
  			"text": "link [CONTENT] URL [URL]",
  			"description": "Creates a Markdown link with a conservatively validated destination.",
  			"arguments": {
  				"CONTENT": {
  					"type": "STRING",
  					"defaultValue": "TurboWarp"
  				},
  				"URL": {
  					"type": "STRING",
  					"defaultValue": "https://turbowarp.org/"
  				}
  			}
  		},
  		{
  			"opcode": "code",
  			"blockType": "REPORTER",
  			"text": "code [TEXT]",
  			"description": "Creates inline code content.",
  			"arguments": { "TEXT": {
  				"type": "STRING",
  				"defaultValue": "status"
  			} }
  		},
  		{
  			"opcode": "heading",
  			"blockType": "REPORTER",
  			"text": "heading [LEVEL] [CONTENT]",
  			"description": "Creates a heading with the level clamped to 1 through 6.",
  			"arguments": {
  				"LEVEL": {
  					"type": "NUMBER",
  					"defaultValue": 1
  				},
  				"CONTENT": {
  					"type": "STRING",
  					"defaultValue": "Sensor"
  				}
  			}
  		},
  		{
  			"opcode": "paragraph",
  			"blockType": "REPORTER",
  			"text": "paragraph [CONTENT]",
  			"description": "Creates a paragraph block.",
  			"arguments": { "CONTENT": {
  				"type": "STRING",
  				"defaultValue": "ready"
  			} }
  		},
  		{
  			"opcode": "quote",
  			"blockType": "REPORTER",
  			"text": "quote [CONTENT]",
  			"description": "Creates a block quote.",
  			"arguments": { "CONTENT": {
  				"type": "STRING",
  				"defaultValue": "quoted"
  			} }
  		},
  		{
  			"opcode": "codeBlock",
  			"blockType": "REPORTER",
  			"text": "code block [TEXT] language [LANGUAGE]",
  			"description": "Creates a fenced code block.",
  			"arguments": {
  				"TEXT": {
  					"type": "STRING",
  					"defaultValue": "console.log('ok')"
  				},
  				"LANGUAGE": {
  					"type": "STRING",
  					"defaultValue": "js"
  				}
  			}
  		},
  		{
  			"opcode": "listItem",
  			"blockType": "REPORTER",
  			"text": "list item [CONTENT]",
  			"description": "Creates a list item fragment.",
  			"arguments": { "CONTENT": {
  				"type": "STRING",
  				"defaultValue": "item"
  			} }
  		},
  		{
  			"opcode": "unorderedList",
  			"blockType": "REPORTER",
  			"text": "unordered list [ITEMS]",
  			"description": "Creates an unordered list from item fragments.",
  			"arguments": { "ITEMS": {
  				"type": "STRING",
  				"defaultValue": ""
  			} }
  		},
  		{
  			"opcode": "orderedList",
  			"blockType": "REPORTER",
  			"text": "ordered list [ITEMS]",
  			"description": "Creates an ordered list from item fragments.",
  			"arguments": { "ITEMS": {
  				"type": "STRING",
  				"defaultValue": ""
  			} }
  		},
  		{
  			"opcode": "concat",
  			"blockType": "REPORTER",
  			"text": "[LEFT] followed by [RIGHT]",
  			"description": "Creates a new Markdown fragment sequence without mutating either input.",
  			"arguments": {
  				"LEFT": {
  					"type": "STRING",
  					"defaultValue": ""
  				},
  				"RIGHT": {
  					"type": "STRING",
  					"defaultValue": ""
  				}
  			}
  		},
  		{
  			"opcode": "render",
  			"blockType": "REPORTER",
  			"text": "render Markdown [FRAGMENT]",
  			"description": "Renders a Markdown fragment to final Markdown text without updating stored validation errors.",
  			"arguments": { "FRAGMENT": {
  				"type": "STRING",
  				"defaultValue": ""
  			} }
  		},
  		{
  			"opcode": "renderWithValidation",
  			"blockType": "REPORTER",
  			"text": "render Markdown with validation [FRAGMENT]",
  			"description": "Validates a Markdown fragment, stores any validation errors, and renders final Markdown text.",
  			"arguments": { "FRAGMENT": {
  				"type": "STRING",
  				"defaultValue": ""
  			} }
  		},
  		{
  			"opcode": "lastValidationErrors",
  			"blockType": "REPORTER",
  			"text": "last Markdown validation errors",
  			"description": "Returns validation errors stored by the most recent render Markdown with validation block.",
  			"arguments": {}
  		},
  		{
  			"opcode": "lastRenderHasValidationErrors",
  			"blockType": "BOOLEAN",
  			"text": "last rendered Markdown has validation errors?",
  			"description": "Reports whether the most recent validated Markdown render stored validation errors.",
  			"arguments": {}
  		},
  		{
  			"opcode": "validateMarkdown",
  			"blockType": "REPORTER",
  			"text": "validate Markdown [FRAGMENT]",
  			"description": "Returns simple validation diagnostics for a Markdown fragment.",
  			"arguments": { "FRAGMENT": {
  				"type": "STRING",
  				"defaultValue": ""
  			} }
  		},
  		{
  			"opcode": "isValidMarkdown",
  			"blockType": "BOOLEAN",
  			"text": "Markdown [FRAGMENT] is valid?",
  			"description": "Reports whether simple validation found no Markdown errors.",
  			"arguments": { "FRAGMENT": {
  				"type": "STRING",
  				"defaultValue": ""
  			} }
  		}
  	]
  };
  //#endregion
  //#region src/markdown.ts
  var empty = { kind: "empty" };
  var SAFE_URL_PATTERN = /^(?:https?:|mailto:|tel:|\/|\.\/|\.\.\/|#|\?|$)/iu;
  var lastRenderValidationResult = {
  	valid: true,
  	issues: []
  };
  function text(value) {
  	return {
  		kind: "text",
  		value
  	};
  }
  function bold(content) {
  	return {
  		kind: "bold",
  		content: normalizeContent(content)
  	};
  }
  function italic(content) {
  	return {
  		kind: "italic",
  		content: normalizeContent(content)
  	};
  }
  function link(content, url) {
  	validateSafeUrl(url);
  	return {
  		kind: "link",
  		content: normalizeContent(content),
  		url
  	};
  }
  function code(value) {
  	return {
  		kind: "code",
  		value
  	};
  }
  function heading(level, content) {
  	return {
  		kind: "heading",
  		level: clampHeadingLevel(level),
  		content: normalizeContent(content)
  	};
  }
  function paragraph(content) {
  	return {
  		kind: "paragraph",
  		content: normalizeContent(content)
  	};
  }
  function quote(content) {
  	return {
  		kind: "quote",
  		content: normalizeContent(content)
  	};
  }
  function codeBlock(value, language = "") {
  	return {
  		kind: "codeBlock",
  		language: sanitizeLanguage(language),
  		value
  	};
  }
  function listItem(content) {
  	return {
  		kind: "listItem",
  		content: normalizeContent(content)
  	};
  }
  function unorderedList(items) {
  	return {
  		kind: "list",
  		ordered: false,
  		items: normalizeItems(items)
  	};
  }
  function orderedList(items) {
  	return {
  		kind: "list",
  		ordered: true,
  		items: normalizeItems(items)
  	};
  }
  function concat(left, right) {
  	const children = [...flattenSequence(left), ...flattenSequence(right)].filter((child) => child.kind !== "empty");
  	if (children.length === 0) return empty;
  	if (children.length === 1) return children[0] ?? empty;
  	return {
  		kind: "sequence",
  		children
  	};
  }
  function render(fragment) {
  	return renderDocument(fragment);
  }
  function renderWithValidation(fragment) {
  	lastRenderValidationResult = validate(fragment);
  	return renderDocument(fragment);
  }
  function validate(fragment) {
  	const issues = [];
  	validateFragment(fragment, "$", [], issues);
  	if (fragment.kind === "empty") issues.push({
  		severity: "warning",
  		path: "$",
  		message: "Markdown fragment is empty."
  	});
  	return {
  		valid: issues.every((issue) => issue.severity !== "error"),
  		issues
  	};
  }
  function isValid(fragment) {
  	return validate(fragment).valid;
  }
  function getLastRenderValidationErrors() {
  	return lastRenderValidationResult.issues.filter((issue) => issue.severity === "error");
  }
  function formatValidationResult(result) {
  	if (result.issues.length === 0) return "valid";
  	return result.issues.map((issue) => `${issue.severity}: ${issue.path}: ${issue.message}`).join("\n");
  }
  function formatValidationErrors(issues) {
  	if (issues.length === 0) return "";
  	return issues.map((issue) => `${issue.path}: ${issue.message}`).join("\n");
  }
  function getLastRenderValidationErrorText() {
  	return formatValidationErrors(getLastRenderValidationErrors());
  }
  function normalizeContent(content) {
  	return typeof content === "string" ? text(content) : content;
  }
  function validateFragment(fragment, path, ancestors, issues) {
  	const parent = ancestors[ancestors.length - 1];
  	const inlineAncestor = ancestors.find((ancestor) => [
  		"bold",
  		"italic",
  		"link"
  	].includes(ancestor.kind));
  	if (!isInline(fragment) && inlineAncestor !== void 0) issues.push({
  		severity: "error",
  		path,
  		message: `${fragment.kind} cannot be nested inside ${inlineAncestor.kind}.`
  	});
  	if (fragment.kind === "listItem" && parent?.kind !== "list") issues.push({
  		severity: "error",
  		path,
  		message: "listItem must be inside a list."
  	});
  	validateWarnings(fragment, path, issues);
  	for (const [index, child] of childFragments(fragment).entries()) validateFragment(child, `${path}.children[${index}]`, [...ancestors, fragment], issues);
  }
  function validateWarnings(fragment, path, issues) {
  	if (fragment.kind === "heading" && isEmptyish(fragment.content)) issues.push({
  		severity: "warning",
  		path,
  		message: "heading should have content."
  	});
  	if (fragment.kind === "paragraph" && isEmptyish(fragment.content)) issues.push({
  		severity: "warning",
  		path,
  		message: "paragraph is empty."
  	});
  	if (fragment.kind === "link" && isEmptyish(fragment.content)) issues.push({
  		severity: "warning",
  		path,
  		message: "link should have visible content."
  	});
  	if (fragment.kind === "link" && fragment.url.trim().length === 0) issues.push({
  		severity: "warning",
  		path,
  		message: "link should have a destination URL."
  	});
  	if (fragment.kind === "list" && fragment.items.length === 0) issues.push({
  		severity: "warning",
  		path,
  		message: "list should contain at least one item."
  	});
  }
  function childFragments(fragment) {
  	switch (fragment.kind) {
  		case "bold":
  		case "italic":
  		case "link":
  		case "heading":
  		case "paragraph":
  		case "quote":
  		case "listItem": return [fragment.content];
  		case "list": return fragment.items;
  		case "sequence": return fragment.children;
  		default: return [];
  	}
  }
  function isEmptyish(fragment) {
  	if (fragment.kind === "empty") return true;
  	if (fragment.kind === "text" || fragment.kind === "code") return fragment.value.length === 0;
  	if (fragment.kind === "sequence") return fragment.children.every(isEmptyish);
  	return false;
  }
  function renderDocument(fragment) {
  	if (fragment.kind === "empty") return "";
  	if (fragment.kind === "sequence") {
  		if (fragment.children.every((child) => isInline(child) || child.kind === "sequence")) return renderInline(fragment);
  		return fragment.children.map(renderDocument).filter(Boolean).join("\n\n");
  	}
  	if (isInline(fragment)) return renderInline(fragment);
  	return renderBlock(fragment);
  }
  function renderBlock(fragment) {
  	switch (fragment.kind) {
  		case "heading": return `${"#".repeat(fragment.level)} ${renderInlineish(fragment.content)}`;
  		case "paragraph": return renderInlineish(fragment.content);
  		case "quote": return renderDocument(fragment.content).split("\n").map((line) => line.length === 0 ? ">" : `> ${line}`).join("\n");
  		case "codeBlock": return renderCodeBlock(fragment);
  		case "list": return fragment.items.map((item, index) => renderListItem(item, fragment.ordered ? `${index + 1}.` : "-")).join("\n");
  		case "listItem": return renderInlineish(fragment.content);
  		default: return renderDocument(fragment);
  	}
  }
  function renderInline(fragment) {
  	switch (fragment.kind) {
  		case "text": return escapeMarkdownText(fragment.value);
  		case "bold": return `**${renderInlineish(fragment.content)}**`;
  		case "italic": return `*${renderInlineish(fragment.content)}*`;
  		case "link": return `[${renderInlineish(fragment.content)}](${escapeUrl(fragment.url)})`;
  		case "code": return renderInlineCode(fragment.value);
  		case "sequence": return fragment.children.map(renderInlineish).join("");
  		case "empty": return "";
  		default: return renderBlock(fragment);
  	}
  }
  function renderInlineish(fragment) {
  	return isInline(fragment) || fragment.kind === "sequence" ? renderInline(fragment) : renderBlock(fragment);
  }
  function renderCodeBlock(fragment) {
  	const fence = longestBacktickRun(fragment.value) >= 3 ? "````" : "```";
  	return `${fence}${fragment.language.length > 0 ? fragment.language : ""}\n${fragment.value}\n${fence}`;
  }
  function renderInlineCode(value) {
  	const fence = "`".repeat(Math.max(1, longestBacktickRun(value) + 1));
  	return `${fence}${value.startsWith("`") || value.endsWith("`") || value.includes("\n") ? ` ${value} ` : value}${fence}`;
  }
  function renderListItem(fragment, marker) {
  	const [first = "", ...rest] = renderDocument(fragment.kind === "listItem" ? fragment.content : fragment).split("\n");
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
  	return [
  		"text",
  		"bold",
  		"italic",
  		"link",
  		"code",
  		"empty"
  	].includes(fragment.kind);
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
  	if (!SAFE_URL_PATTERN.test(trimmed)) throw new TypeError(`Unsafe URL value: ${value}`);
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
  //#endregion
  //#region src/extension.ts
  var SERIALIZED_PREFIX = "turbowarp-markdown:v1:";
  var blockDefinitions = block_definitions_default.blocks;
  var MarkdownExtension = class {
  	constructor() {
  		this.fixedInputs = fixedInputRegistration(typeof Scratch === "undefined" ? void 0 : Scratch);
  	}
  	dispose() {
  		this.fixedInputs.dispose();
  	}
  	getInfo() {
  		this.fixedInputs.ensure(blockDefinitions.map((block) => `${extensionConfig.id}_${block.opcode}`));
  		return {
  			id: extensionConfig.id,
  			name: Scratch.translate(block_definitions_default.extensionName),
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
  	renderWithValidation(args) {
  		return renderWithValidation(decodeOrText(args.FRAGMENT));
  	}
  	lastValidationErrors() {
  		return getLastRenderValidationErrorText();
  	}
  	lastRenderHasValidationErrors() {
  		return getLastRenderValidationErrors().length > 0;
  	}
  	validateMarkdown(args) {
  		return formatValidationResult(validate(decodeOrText(args.FRAGMENT)));
  	}
  	isValidMarkdown(args) {
  		return isValid(decodeOrText(args.FRAGMENT));
  	}
  	toScratchBlock(block) {
  		return {
  			opcode: block.opcode,
  			blockType: Scratch.BlockType[block.blockType],
  			text: Scratch.translate(block.text),
  			arguments: Object.fromEntries(Object.entries(block.arguments).map(([name, argument]) => [name, {
  				type: Scratch.ArgumentType[argument.type],
  				defaultValue: argument.defaultValue
  			}]))
  		};
  	}
  };
  function encode(fragment) {
  	return `${SERIALIZED_PREFIX}${JSON.stringify(fragment)}`;
  }
  function decodeOrText(value) {
  	const raw = Scratch.Cast.toString(value);
  	if (!raw.startsWith(SERIALIZED_PREFIX)) return text(raw);
  	return parseFragment(raw.slice(22));
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
  	if (record.kind === "bold" || record.kind === "italic" || record.kind === "paragraph") return isFragment(record.content);
  	if (record.kind === "link") return typeof record.url === "string" && isFragment(record.content);
  	if (record.kind === "heading") return typeof record.level === "number" && isFragment(record.content);
  	if (record.kind === "quote" || record.kind === "listItem") return isFragment(record.content);
  	if (record.kind === "codeBlock") return typeof record.language === "string" && typeof record.value === "string";
  	if (record.kind === "list") return typeof record.ordered === "boolean" && Array.isArray(record.items) && record.items.every(isFragment);
  	if (record.kind === "sequence") return Array.isArray(record.children) && record.children.every(isFragment);
  	return false;
  }
  //#endregion
  //#region src/index.ts
  if (extensionConfig.unsandboxed && !Scratch.extensions.unsandboxed) throw new Error(`${extensionConfig.name} must run unsandboxed.`);
  Scratch.extensions.register(new MarkdownExtension());
  //#endregion

})(Scratch);
