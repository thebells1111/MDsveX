import { join } from 'path';
import fs from 'fs';
import { parse } from 'svelte/compiler';
import unified from 'unified';
import markdown from 'remark-parse';
import external from 'remark-external-links';
import extract_frontmatter from 'remark-frontmatter';
import remark2rehype from 'remark-rehype';
import hast_to_html from '@starptech/prettyhtml-hast-to-html';

import { mdsvex_parser } from './parsers/';
import {
	default_frontmatter,
	parse_frontmatter,
	escape_code,
	transform_hast,
	smartypants_transformer,
	highlight_blocks,
	code_highlight,
} from './transformers/';

function stringify(options = {}) {
	this.Compiler = compiler;

	function compiler(tree) {
		return hast_to_html(tree, options);
	}
}

const apply_plugins = (plugins, parser) => {
	plugins.forEach(plugin => {
		if (Array.isArray(plugin)) {
			if (plugin[1]) parser.use(plugin[0], plugin[1]);
			else parser.use(plugin[0]);
		} else {
			parser.use(plugin);
		}
	});

	return parser;
};

export function transform({
	remarkPlugins = [],
	rehypePlugins = [],
	frontmatter,
	smartypants,
	layout,
	highlight,
} = {}) {
	const fm_opts = frontmatter
		? frontmatter
		: { parse: default_frontmatter, type: 'yaml', marker: '-' };
	const toMDAST = unified()
		.use(markdown)
		.use(mdsvex_parser)
		.use(external, { target: false, rel: ['nofollow'] })
		.use(escape_code, { blocks: !!highlight })
		.use(extract_frontmatter, fm_opts)
		.use(parse_frontmatter, { parse: fm_opts.parse, type: fm_opts.type })
		.use(highlight_blocks, highlight);

	if (smartypants) {
		toMDAST.use(
			smartypants_transformer,
			typeof smartypants === 'boolean' ? {} : smartypants
		);
	}

	apply_plugins(remarkPlugins, toMDAST);

	const toHAST = toMDAST
		.use(remark2rehype, {
			allowDangerousHTML: true,
			allowDangerousCharacters: true,
		})
		.use(transform_hast, { layout });

	apply_plugins(rehypePlugins, toHAST);

	const processor = toHAST.use(stringify, {
		allowDangerousHTML: true,
		allowDangerousCharacters: true,
	});

	return processor;
}

const defaults = {
	remarkPlugins: [],
	rehypePlugins: [],
	smartypants: true,
	extension: '.svx',
	layout: false,
	highlight: { highlighter: code_highlight },
};

function resolve_layout(layout_path) {
	try {
		require.resolve(layout_path);
		return layout_path;
	} catch (e) {
		try {
			const _path = join(process.cwd(), layout_path);
			require.resolve(_path);
			return _path;
		} catch (e) {
			throw new Error(
				`The layout path you provided couldn't be found at either ${layout_path} or ${join(
					process.cwd(),
					layout_path
				)}. Please double-check it and try again.`
			);
		}
	}
}

function process_layouts(layouts) {
	const _layouts = layouts;

	for (const key in _layouts) {
		const layout = fs.readFileSync(_layouts[key].path, { encoding: 'utf8' });
		const ast = parse(layout);

		if (ast.module) {
			const component_export = ast.module.content.body.find(
				node =>
					node.type === 'ExportNamedDeclaration' &&
					(node.declaration.declarations[0].id.name === 'components' ||
						node.declaration.declarations[0].id.name === 'Components')
			);

			if (component_export) {
				_layouts[key].components = {};

				_layouts[key].components.export_name =
					component_export.declaration.declarations[0].id.name;

				_layouts[
					key
				].components.map = component_export.declaration.declarations[0].init.properties.reduce(
					(acc, { key, value }) => {
						const _key = key.name;
						const _value = {
							name: value.name === value.name,
						};

						return { ...acc, [_key]: _value };
					},
					{}
				);
			}
		}
	}

	return _layouts;
}

export const mdsvex = ({
	remarkPlugins = [],
	rehypePlugins = [],
	smartypants = true,
	extension = '.svx',
	layout = false,
	highlight = { highlighter: code_highlight },
	frontmatter,
} = defaults) => {
	let _layout = layout ? {} : layout;

	if (typeof layout === 'string') {
		_layout.__mdsvex_default = { path: resolve_layout(layout) };
	} else if (typeof layout === 'object') {
		for (const name in layout) {
			_layout[name] = { path: resolve_layout(layout[name]) };
		}
	}
	if (highlight && highlight.highlighter === undefined) {
		highlight.highlighter = code_highlight;
	}

	_layout = process_layouts(_layout);

	const parser = transform({
		remarkPlugins,
		rehypePlugins,
		smartypants,
		layout: _layout,
		highlight,
		frontmatter,
	});

	return {
		markup: async ({ content, filename }) => {
			if (filename.split('.').pop() !== extension.split('.').pop()) return;

			const parsed = await parser.process({ contents: content, filename });

			return { code: parsed.contents };
		},
	};
};
