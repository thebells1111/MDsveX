import { mdsvex } from '../../src/';

export default function(test) {
	test('it should not highlight code when false is passed', async t => {
		const output = await mdsvex({ highlight: false }).markup({
			content: `
\`\`\`js
const some_var = whatever;
\`\`\`
    `,
			filename: 'thing.svx',
		});

		t.equal(
			`<pre><code class="language-js">const some_var = whatever;
</code></pre>`,
			output.code
		);
	});

	test('it should escape code when false is passed', async t => {
		const output = await mdsvex({ highlight: false }).markup({
			content: `
\`\`\`html
<script>
  function() {
    whatever;
  }
</script>
\`\`\`
    `,
			filename: 'thing.svx',
		});

		t.equal(
			`<pre><code class="language-html">&lt;script&gt;
  function() &#123;
    whatever;
  &#125;
&lt;/script&gt;
</code></pre>`,
			output.code
		);
	});

	test('it should highlight code when nothing is passed', async t => {
		const output = await mdsvex().markup({
			content: `
\`\`\`js
const thing = 'string';
\`\`\`
    `,
			filename: 'thing.svx',
		});

		t.equal(
			`<pre class="language-js">
<code class="language-js"><span class="token keyword">const</span> thing <span class="token operator">=</span> <span class="token string">'string'</span><span class="token punctuation">;</span></code>
</pre>`,
			output.code
		);
	});

	test('it should escape when highlighting (kinda)', async t => {
		const output = await mdsvex().markup({
			content: `
\`\`\`js
function() {
	whatever;
}
\`\`\`
    `,
			filename: 'thing.svx',
		});

		t.equal(
			`<pre class="language-js">
<code class="language-js"><span class="token keyword">function</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">&#123;</span>
	whatever<span class="token punctuation">;</span>
<span class="token punctuation">&#125;</span></code>
</pre>`,
			output.code
		);
	});

	test('it should highlight code when nothing is passed, with a non-default language', async t => {
		const output = await mdsvex().markup({
			content: `
\`\`\`ruby
print 'Please type name >'
name = gets.chomp
puts "Hello #{name}."
\`\`\`
    `,
			filename: 'thing.svx',
		});

		t.equal(
			`<pre class="language-ruby">
<code class="language-ruby">print <span class="token string">'Please type name >'</span>
name <span class="token operator">=</span> gets<span class="token punctuation">.</span>chomp
puts <span class="token string">"Hello <span class="token interpolation"><span class="token delimiter tag">#&#123;</span>name<span class="token delimiter tag">&#125;</span></span>."</span></code>
</pre>`,
			output.code
		);
	});

	test('it should highlight code when nothing is passed, with a more obscure language', async t => {
		const output = await mdsvex().markup({
			content: `
\`\`\`ebnf
SYNTAX = SYNTAX RULE, (: SYNTAX RULE :).
SYNTAX RULE
  = META IDENTIFIER, '=', DEFINITIONS LIST, '.'. (* '.' instead of ';' *)
DEFINITIONS LIST
  = SINGLE DEFINITION,
    (: '/', SINGLE DEFINITION :).
\`\`\`
    `,
			filename: 'thing.svx',
		});

		t.equal(
			`<pre class="language-ebnf">
<code class="language-ebnf"><span class="token definition rule keyword">SYNTAX</span> <span class="token operator">=</span> <span class="token rule">SYNTAX RULE</span><span class="token punctuation">,</span> <span class="token punctuation">(:</span> <span class="token rule">SYNTAX RULE</span> <span class="token punctuation">:)</span><span class="token punctuation">.</span>
<span class="token definition rule keyword">SYNTAX RULE</span>
  <span class="token operator">=</span> <span class="token rule">META IDENTIFIER</span><span class="token punctuation">,</span> <span class="token string">'='</span><span class="token punctuation">,</span> <span class="token rule">DEFINITIONS LIST</span><span class="token punctuation">,</span> <span class="token string">'.'</span><span class="token punctuation">.</span> <span class="token comment">(* '.' instead of ';' *)</span>
<span class="token definition rule keyword">DEFINITIONS LIST</span>
  <span class="token operator">=</span> <span class="token rule">SINGLE DEFINITION</span><span class="token punctuation">,</span>
    <span class="token punctuation">(:</span> <span class="token string">'/'</span><span class="token punctuation">,</span> <span class="token rule">SINGLE DEFINITION</span> <span class="token punctuation">:)</span><span class="token punctuation">.</span></code>
</pre>`,
			output.code
		);
	});

	test('Should be possible to pass a custom highlight function ', async t => {
		function _highlight(code, lang) {
			return `<code class="${lang}">${code}</code>`;
		}

		const output = await mdsvex({
			highlight: { highlighter: _highlight },
		}).markup({
			content: `
\`\`\`somecode
i am some code
\`\`\`
    `,
			filename: 'thing.svx',
		});

		t.equal(`<code class="somecode">i am some code</code>`, output.code);
	});

	test('Should be possible to define a custom alias for a language', async t => {
		const output = await mdsvex({
			highlight: { alias: { beeboo: 'html' } },
		}).markup({
			content: `
\`\`\`beeboo
<h1>Title</h1>
\`\`\`
    `,
			filename: 'thing.svx',
		});

		t.equal(
			`<pre class="language-beeboo">
<code class="language-beeboo"><span class="token tag"><span class="token tag"><span class="token punctuation">&lt;</span>h1</span><span class="token punctuation">></span></span>Title<span class="token tag"><span class="token tag"><span class="token punctuation">&lt;/</span>h1</span><span class="token punctuation">></span></span></code>
</pre>`,
			output.code
		);
	});
}
