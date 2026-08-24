import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import MarkdownIt from 'markdown-it';

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(scriptDirectory, '..');
const inputPath = path.resolve(
	process.argv[2] ?? path.join(repositoryRoot, 'docs', 'funding-acquisition-plan.md')
);
const outputPath = path.resolve(
	process.argv[3] ??
		path.join(repositoryRoot, 'docs', 'Syntaxxed-Funding-Acquisition-Plan.html')
);

const source = await readFile(inputPath, 'utf8');
const sourceLines = source.replace(/\r\n/g, '\n').split('\n');
const title = sourceLines.shift()?.replace(/^#\s+/, '').trim() || 'Syntaxxed Plan';

while (sourceLines[0]?.trim() === '') {
	sourceLines.shift();
}

const metadata = [];
while (sourceLines.length > 0 && !sourceLines[0]?.startsWith('## ')) {
	const line = sourceLines.shift()?.trim();
	if (line) {
		if (/^[A-Z][^:]{0,80}:/.test(line) || metadata.length === 0) {
			metadata.push(line.replace(/\s{2,}$/, ''));
		} else {
			metadata[metadata.length - 1] += ` ${line.replace(/\s{2,}$/, '')}`;
		}
	}
}

const slugCounts = new Map();
function slugify(value) {
	const base =
		value
			.toLowerCase()
			.normalize('NFKD')
			.replace(/[\u0300-\u036f]/g, '')
			.replace(/[^a-z0-9]+/g, '-')
			.replace(/^-|-$/g, '') || 'section';
	const count = slugCounts.get(base) ?? 0;
	slugCounts.set(base, count + 1);
	return count === 0 ? base : `${base}-${count + 1}`;
}

const md = new MarkdownIt({
	html: false,
	linkify: true,
	typographer: true,
});

md.renderer.rules.heading_open = (tokens, index, options, environment, renderer) => {
	const level = Number(tokens[index].tag.slice(1));
	const headingText = tokens[index + 1]?.content ?? '';
	const id = slugify(headingText);
	tokens[index].attrSet('id', id);
	environment.headings.push({ level, text: headingText, id });
	return renderer.renderToken(tokens, index, options);
};

const defaultLinkOpen =
	md.renderer.rules.link_open ??
	((tokens, index, options, _environment, renderer) =>
		renderer.renderToken(tokens, index, options));
md.renderer.rules.link_open = (tokens, index, options, environment, renderer) => {
	const hrefIndex = tokens[index].attrIndex('href');
	const href = hrefIndex >= 0 ? tokens[index].attrs?.[hrefIndex]?.[1] : '';
	if (/^https?:\/\//i.test(href ?? '')) {
		tokens[index].attrSet('target', '_blank');
		tokens[index].attrSet('rel', 'noopener noreferrer');
	}
	return defaultLinkOpen(tokens, index, options, environment, renderer);
};

md.renderer.rules.table_open = () => '<div class="table-wrap" role="region" aria-label="Scrollable table" tabindex="0"><table>\n';
md.renderer.rules.table_close = () => '</table></div>\n';

const environment = { headings: [] };
const renderedContent = md.render(sourceLines.join('\n'), environment);
const navigation = environment.headings
	.filter(({ level }) => level === 2 || level === 3)
	.map(
		({ level, text, id }) =>
			`<a class="toc-link toc-level-${level}" href="#${id}">${escapeHtml(text)}</a>`
	)
	.join('\n');

function escapeHtml(value) {
	return value
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#039;');
}

const metadataHtml = metadata
	.map((item) => `<span class="meta-pill">${escapeHtml(item)}</span>`)
	.join('');

const html = `<!doctype html>
<html lang="en">
<head>
	<meta charset="utf-8">
	<meta name="viewport" content="width=device-width, initial-scale=1">
	<meta name="description" content="Syntaxxed funding and strategic-acquisition operating plan">
	<meta name="color-scheme" content="light">
	<title>${escapeHtml(title)}</title>
	<style>
		:root {
			--navy-950: #07111f;
			--navy-900: #0b192c;
			--navy-800: #12243d;
			--navy-700: #1c3657;
			--ink: #172033;
			--muted: #5f6b7c;
			--line: #dce3ec;
			--paper: #ffffff;
			--canvas: #f3f6fa;
			--teal: #12b89a;
			--teal-dark: #087f6c;
			--teal-soft: #e8f8f4;
			--amber: #f3a712;
			--amber-soft: #fff6dc;
			--blue-soft: #edf4ff;
			--shadow: 0 18px 48px rgba(15, 31, 51, 0.08);
			--radius: 16px;
			--sidebar-width: 318px;
		}

		* { box-sizing: border-box; }

		html {
			scroll-behavior: smooth;
			scroll-padding-top: 76px;
		}

		body {
			margin: 0;
			color: var(--ink);
			background:
				radial-gradient(circle at 90% 0%, rgba(18, 184, 154, 0.08), transparent 34rem),
				var(--canvas);
			font-family: Inter, ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
			font-size: 16px;
			line-height: 1.72;
			-webkit-font-smoothing: antialiased;
		}

		a {
			color: var(--teal-dark);
			text-decoration-thickness: 1px;
			text-underline-offset: 3px;
		}

		a:hover { color: #055c50; }

		.skip-link {
			position: fixed;
			top: 10px;
			left: 10px;
			z-index: 1000;
			padding: 10px 14px;
			color: white;
			background: var(--teal-dark);
			border-radius: 8px;
			transform: translateY(-150%);
		}

		.skip-link:focus { transform: translateY(0); }

		.reading-progress {
			position: fixed;
			inset: 0 0 auto 0;
			z-index: 900;
			height: 4px;
			background: rgba(18, 184, 154, 0.12);
		}

		.reading-progress span {
			display: block;
			width: 0;
			height: 100%;
			background: linear-gradient(90deg, var(--teal), var(--amber));
		}

		.sidebar {
			position: fixed;
			inset: 0 auto 0 0;
			z-index: 100;
			width: var(--sidebar-width);
			padding: 34px 24px 24px;
			color: #dce7f5;
			background:
				linear-gradient(155deg, rgba(18, 184, 154, 0.14), transparent 38%),
				var(--navy-950);
			border-right: 1px solid rgba(255, 255, 255, 0.08);
			overflow-y: auto;
			scrollbar-width: thin;
			scrollbar-color: #34506f transparent;
		}

		.brand {
			display: flex;
			align-items: center;
			gap: 13px;
			margin-bottom: 26px;
		}

		.brand-mark {
			display: grid;
			width: 44px;
			height: 44px;
			place-items: center;
			color: var(--navy-950);
			background: linear-gradient(135deg, #45dec3, var(--teal));
			border-radius: 13px;
			box-shadow: 0 10px 30px rgba(18, 184, 154, 0.26);
			font-size: 22px;
			font-weight: 900;
		}

		.brand-name {
			color: white;
			font-size: 19px;
			font-weight: 800;
			letter-spacing: 0.02em;
		}

		.brand-subtitle {
			display: block;
			margin-top: 2px;
			color: #8fa5bf;
			font-size: 11px;
			font-weight: 700;
			letter-spacing: 0.12em;
			text-transform: uppercase;
		}

		.sidebar-label {
			margin: 22px 8px 10px;
			color: #7f96b1;
			font-size: 10px;
			font-weight: 800;
			letter-spacing: 0.16em;
			text-transform: uppercase;
		}

		.toc {
			display: flex;
			flex-direction: column;
			gap: 2px;
		}

		.toc-link {
			display: block;
			padding: 7px 10px;
			color: #aebfd3;
			border-left: 2px solid transparent;
			border-radius: 0 8px 8px 0;
			font-size: 12px;
			line-height: 1.35;
			text-decoration: none;
			transition: 150ms ease;
		}

		.toc-link:hover {
			color: white;
			background: rgba(255, 255, 255, 0.05);
		}

		.toc-link.active {
			color: #62e3cd;
			background: rgba(18, 184, 154, 0.1);
			border-left-color: var(--teal);
		}

		.toc-level-3 {
			padding-left: 24px;
			color: #8095ae;
			font-size: 11px;
		}

		.sidebar-note {
			margin-top: 24px;
			padding: 14px;
			color: #aebfd3;
			background: rgba(255, 255, 255, 0.04);
			border: 1px solid rgba(255, 255, 255, 0.07);
			border-radius: 12px;
			font-size: 11px;
			line-height: 1.5;
		}

		.page-shell {
			min-height: 100vh;
			margin-left: var(--sidebar-width);
		}

		.toolbar {
			position: sticky;
			top: 0;
			z-index: 80;
			display: flex;
			align-items: center;
			justify-content: flex-end;
			gap: 10px;
			height: 64px;
			padding: 0 42px;
			background: rgba(243, 246, 250, 0.88);
			border-bottom: 1px solid rgba(198, 209, 221, 0.7);
			backdrop-filter: blur(14px);
		}

		.toolbar button,
		.back-to-top {
			display: inline-flex;
			align-items: center;
			justify-content: center;
			gap: 8px;
			min-height: 38px;
			padding: 8px 14px;
			color: var(--navy-800);
			background: white;
			border: 1px solid #ced8e4;
			border-radius: 10px;
			box-shadow: 0 3px 12px rgba(14, 32, 54, 0.05);
			font: inherit;
			font-size: 12px;
			font-weight: 750;
			cursor: pointer;
		}

		.toolbar button:hover,
		.back-to-top:hover {
			border-color: var(--teal);
			color: var(--teal-dark);
		}

		.menu-button { display: none !important; }

		.document {
			width: min(100% - 64px, 1080px);
			margin: 0 auto;
			padding: 34px 0 100px;
		}

		.hero {
			position: relative;
			overflow: hidden;
			margin-bottom: 30px;
			padding: clamp(36px, 6vw, 68px);
			color: white;
			background:
				linear-gradient(145deg, rgba(18, 184, 154, 0.18), transparent 44%),
				linear-gradient(320deg, rgba(243, 167, 18, 0.12), transparent 34%),
				var(--navy-900);
			border: 1px solid rgba(255, 255, 255, 0.08);
			border-radius: 24px;
			box-shadow: 0 26px 70px rgba(8, 22, 40, 0.18);
		}

		.hero::after {
			position: absolute;
			right: -120px;
			bottom: -160px;
			width: 390px;
			height: 390px;
			background:
				linear-gradient(rgba(255, 255, 255, 0.035) 1px, transparent 1px),
				linear-gradient(90deg, rgba(255, 255, 255, 0.035) 1px, transparent 1px);
			background-size: 28px 28px;
			border: 1px solid rgba(255, 255, 255, 0.08);
			border-radius: 50%;
			content: "";
			transform: rotate(14deg);
		}

		.hero-content {
			position: relative;
			z-index: 1;
			max-width: 800px;
		}

		.eyebrow {
			margin: 0 0 16px;
			color: #67e5d0;
			font-size: 12px;
			font-weight: 850;
			letter-spacing: 0.18em;
			text-transform: uppercase;
		}

		.hero h1 {
			margin: 0;
			max-width: 780px;
			color: white;
			font-size: clamp(34px, 5.4vw, 64px);
			line-height: 1.02;
			letter-spacing: -0.048em;
		}

		.hero-summary {
			max-width: 720px;
			margin: 24px 0 0;
			color: #bfd0e4;
			font-size: clamp(16px, 2vw, 20px);
			line-height: 1.55;
		}

		.meta-row {
			display: flex;
			flex-wrap: wrap;
			gap: 8px;
			margin-top: 28px;
		}

		.meta-pill {
			display: inline-flex;
			padding: 7px 11px;
			color: #dce8f5;
			background: rgba(255, 255, 255, 0.07);
			border: 1px solid rgba(255, 255, 255, 0.1);
			border-radius: 999px;
			font-size: 11px;
			font-weight: 650;
		}

		.snapshot {
			display: grid;
			grid-template-columns: repeat(4, 1fr);
			gap: 12px;
			margin: -52px 26px 36px;
			position: relative;
			z-index: 3;
		}

		.snapshot-card {
			padding: 18px 18px 16px;
			background: white;
			border: 1px solid #dfe6ee;
			border-radius: 14px;
			box-shadow: var(--shadow);
		}

		.snapshot-value {
			display: block;
			color: var(--navy-900);
			font-size: 25px;
			font-weight: 850;
			line-height: 1;
			letter-spacing: -0.04em;
		}

		.snapshot-label {
			display: block;
			margin-top: 7px;
			color: var(--muted);
			font-size: 10px;
			font-weight: 750;
			letter-spacing: 0.1em;
			text-transform: uppercase;
		}

		.content {
			padding: clamp(24px, 4vw, 56px);
			background: var(--paper);
			border: 1px solid #e0e6ee;
			border-radius: 20px;
			box-shadow: var(--shadow);
		}

		.content h2,
		.content h3 {
			position: relative;
			color: var(--navy-900);
			scroll-margin-top: 84px;
		}

		.content h2 {
			margin: 68px 0 22px;
			padding-top: 22px;
			border-top: 1px solid var(--line);
			font-size: clamp(25px, 3vw, 34px);
			line-height: 1.18;
			letter-spacing: -0.035em;
		}

		.content h2:first-child {
			margin-top: 0;
			padding-top: 0;
			border-top: 0;
		}

		.content h2.stage-heading {
			padding: 28px 30px;
			background:
				linear-gradient(135deg, var(--blue-soft), rgba(232, 248, 244, 0.72));
			border: 1px solid #d7e5ef;
			border-radius: 16px;
		}

		.content h3 {
			margin: 38px 0 14px;
			font-size: 20px;
			line-height: 1.32;
			letter-spacing: -0.02em;
		}

		.content p { margin: 0 0 17px; }

		.content strong {
			color: #102138;
			font-weight: 780;
		}

		.content ul,
		.content ol {
			margin: 8px 0 22px;
			padding-left: 24px;
		}

		.content li { margin: 6px 0; }
		.content li::marker { color: var(--teal-dark); font-weight: 800; }

		blockquote {
			margin: 26px 0;
			padding: 22px 24px;
			color: #143a35;
			background: linear-gradient(135deg, var(--teal-soft), #f5fbfa);
			border: 1px solid #bfe8df;
			border-left: 5px solid var(--teal);
			border-radius: 12px;
			font-size: 18px;
			font-weight: 650;
		}

		blockquote p:last-child { margin-bottom: 0; }

		code {
			padding: 0.14em 0.36em;
			color: #7b3d00;
			background: var(--amber-soft);
			border: 1px solid #f4df9d;
			border-radius: 5px;
			font-family: "Cascadia Code", Consolas, monospace;
			font-size: 0.88em;
		}

		.table-wrap {
			width: 100%;
			margin: 24px 0 32px;
			overflow-x: auto;
			background: white;
			border: 1px solid var(--line);
			border-radius: 13px;
			box-shadow: 0 8px 26px rgba(20, 40, 65, 0.05);
		}

		table {
			width: 100%;
			min-width: 700px;
			border-collapse: collapse;
			font-size: 13px;
			line-height: 1.45;
		}

		th {
			padding: 13px 14px;
			color: white;
			background: var(--navy-800);
			border-right: 1px solid rgba(255, 255, 255, 0.09);
			text-align: left;
			font-size: 10px;
			font-weight: 800;
			letter-spacing: 0.08em;
			text-transform: uppercase;
		}

		td {
			padding: 12px 14px;
			border-top: 1px solid #e7ecf2;
			vertical-align: top;
		}

		tbody tr:nth-child(even) { background: #f8fafc; }
		tbody tr:hover { background: #eff8f6; }

		.content hr {
			height: 1px;
			margin: 40px 0;
			background: var(--line);
			border: 0;
		}

		.document-footer {
			display: flex;
			justify-content: space-between;
			gap: 20px;
			padding: 28px 8px 0;
			color: var(--muted);
			font-size: 11px;
		}

		.back-to-top {
			position: fixed;
			right: 24px;
			bottom: 24px;
			z-index: 70;
			width: 42px;
			height: 42px;
			padding: 0;
			border-radius: 50%;
			opacity: 0;
			pointer-events: none;
			transform: translateY(8px);
			transition: 180ms ease;
		}

		.back-to-top.visible {
			opacity: 1;
			pointer-events: auto;
			transform: translateY(0);
		}

		@media (max-width: 1060px) {
			:root { --sidebar-width: 286px; }
			.document { width: min(100% - 40px, 980px); }
			.snapshot { grid-template-columns: repeat(2, 1fr); }
		}

		@media (max-width: 820px) {
			.sidebar {
				width: min(88vw, 330px);
				transform: translateX(-105%);
				transition: transform 180ms ease;
				box-shadow: 18px 0 45px rgba(5, 18, 34, 0.24);
			}

			body.navigation-open .sidebar { transform: translateX(0); }
			.page-shell { margin-left: 0; }
			.toolbar { padding: 0 20px; justify-content: space-between; }
			.menu-button { display: inline-flex !important; }
			.document { width: min(100% - 28px, 760px); padding-top: 20px; }
			.hero { border-radius: 18px; }
			.snapshot { margin: -32px 14px 28px; }
			.content { border-radius: 16px; }
		}

		@media (max-width: 560px) {
			body { overflow-x: hidden; }
			.toolbar .button-label { display: none; }
			.document { width: calc(100% - 20px); }
			.hero { padding: 34px 24px 48px; }
			.hero h1 {
				font-size: clamp(30px, 10vw, 38px);
				overflow-wrap: anywhere;
			}
			.hero-summary { font-size: 16px; }
			.meta-pill {
				max-width: 100%;
				border-radius: 14px;
				line-height: 1.4;
				overflow-wrap: anywhere;
			}
			.snapshot { grid-template-columns: 1fr 1fr; gap: 8px; }
			.snapshot-card { min-width: 0; padding: 14px; }
			.snapshot-value { font-size: 21px; }
			.content { padding: 24px 20px 38px; }
			.content,
			.content h2,
			.content h3 { overflow-wrap: anywhere; }
			.content h2 { margin-top: 52px; }
			.content h2.stage-heading { padding: 22px; }
			.document-footer { flex-direction: column; }
		}

		@media print {
			@page { size: A4; margin: 14mm 13mm 16mm; }

			html { scroll-padding-top: 0; }

			body {
				color: #111827;
				background: white;
				font-size: 9.5pt;
				line-height: 1.42;
			}

			.sidebar,
			.toolbar,
			.reading-progress,
			.back-to-top,
			.skip-link { display: none !important; }

			.page-shell { margin: 0; }

			.document {
				width: 100%;
				margin: 0;
				padding: 0;
			}

			.hero {
				min-height: 230mm;
				margin: 0;
				padding: 32mm 22mm;
				background: var(--navy-900) !important;
				border: 0;
				border-radius: 0;
				box-shadow: none;
				break-after: page;
				print-color-adjust: exact;
				-webkit-print-color-adjust: exact;
			}

			.hero h1 { font-size: 34pt; }
			.hero-summary { font-size: 14pt; }
			.snapshot { display: none; }

			.content {
				padding: 0;
				border: 0;
				border-radius: 0;
				box-shadow: none;
			}

			.content h2 {
				margin: 12mm 0 5mm;
				padding-top: 5mm;
				font-size: 19pt;
				break-after: avoid-page;
			}

			.content h2.stage-heading {
				padding: 6mm;
				background: #eef4f7 !important;
				print-color-adjust: exact;
				-webkit-print-color-adjust: exact;
			}

			.content h3 {
				margin: 8mm 0 3mm;
				font-size: 13pt;
				break-after: avoid-page;
			}

			blockquote {
				background: #effaf7 !important;
				print-color-adjust: exact;
				-webkit-print-color-adjust: exact;
			}

			.table-wrap {
				overflow: visible;
				box-shadow: none;
				break-inside: auto;
			}

			table {
				min-width: 0;
				font-size: 6.8pt;
				line-height: 1.25;
			}

			th,
			td { padding: 2mm 2.2mm; }
			th {
				background: #173252 !important;
				print-color-adjust: exact;
				-webkit-print-color-adjust: exact;
			}

			tr { break-inside: avoid; }
			a { color: inherit; overflow-wrap: anywhere; }
			.document-footer { display: none; }
		}
	</style>
</head>
<body>
	<a class="skip-link" href="#main-content">Skip to document</a>
	<div class="reading-progress" aria-hidden="true"><span id="reading-progress-bar"></span></div>

	<aside class="sidebar" id="sidebar" aria-label="Document navigation">
		<div class="brand">
			<div class="brand-mark" aria-hidden="true">R</div>
			<div>
				<div class="brand-name">Syntaxxed</div>
				<span class="brand-subtitle">Strategic plan</span>
			</div>
		</div>
		<div class="sidebar-label">Contents</div>
		<nav class="toc" id="table-of-contents">
			${navigation}
		</nav>
		<div class="sidebar-note">
			<strong>Working document</strong><br>
			Review pipelines every week and stage gates monthly. Replace role
			owners with named individuals as the team grows.
		</div>
	</aside>

	<div class="page-shell">
		<header class="toolbar">
			<button class="menu-button" id="menu-button" type="button" aria-controls="sidebar" aria-expanded="false">
				<span aria-hidden="true">☰</span>
				<span class="button-label">Contents</span>
			</button>
			<button id="print-button" type="button">
				<span aria-hidden="true">↗</span>
				<span class="button-label">Print / Save PDF</span>
			</button>
		</header>

		<main class="document" id="main-content">
			<section class="hero" aria-labelledby="document-title">
				<div class="hero-content">
					<p class="eyebrow">Strategic operating plan</p>
					<h1 id="document-title">${escapeHtml(title)}</h1>
					<p class="hero-summary">
						Developer adoption → enterprise evidence → focused funding
						or a high-leverage strategic outcome.
					</p>
					<div class="meta-row">${metadataHtml}</div>
				</div>
			</section>

			<section class="snapshot" aria-label="Plan summary">
				<div class="snapshot-card"><span class="snapshot-value">18</span><span class="snapshot-label">Month horizon</span></div>
				<div class="snapshot-card"><span class="snapshot-value">39</span><span class="snapshot-label">Master actions</span></div>
				<div class="snapshot-card"><span class="snapshot-value">4</span><span class="snapshot-label">Operating pipelines</span></div>
				<div class="snapshot-card"><span class="snapshot-value">5</span><span class="snapshot-label">Decision gates</span></div>
			</section>

			<article class="content">
				${renderedContent}
			</article>

			<footer class="document-footer">
				<span>Syntaxxed · Confidential working plan</span>
				<span>Self-contained offline HTML · Source: ${escapeHtml(path.basename(inputPath))}</span>
			</footer>
		</main>
	</div>

	<button class="back-to-top" id="back-to-top" type="button" aria-label="Back to top">↑</button>

	<script>
		(() => {
			const progressBar = document.getElementById('reading-progress-bar');
			const backToTop = document.getElementById('back-to-top');
			const menuButton = document.getElementById('menu-button');
			const printButton = document.getElementById('print-button');
			const tocLinks = [...document.querySelectorAll('.toc-link')];
			const sections = [...document.querySelectorAll('.content h2, .content h3')];

			for (const heading of document.querySelectorAll('.content h2')) {
				if (/^Stage \d/i.test(heading.textContent.trim())) {
					heading.classList.add('stage-heading');
				}
			}

			const updateProgress = () => {
				const scrollable = document.documentElement.scrollHeight - window.innerHeight;
				const percent = scrollable > 0 ? Math.min(100, (window.scrollY / scrollable) * 100) : 0;
				progressBar.style.width = percent + '%';
				backToTop.classList.toggle('visible', window.scrollY > 700);
			};

			const setActiveLink = (id) => {
				for (const link of tocLinks) {
					link.classList.toggle('active', link.getAttribute('href') === '#' + id);
				}
			};

			const observer = new IntersectionObserver(
				(entries) => {
					const visible = entries
						.filter((entry) => entry.isIntersecting)
						.sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
					if (visible[0]) setActiveLink(visible[0].target.id);
				},
				{ rootMargin: '-15% 0px -74% 0px', threshold: 0 }
			);

			for (const section of sections) observer.observe(section);
			for (const link of tocLinks) {
				link.addEventListener('click', () => {
					document.body.classList.remove('navigation-open');
					menuButton.setAttribute('aria-expanded', 'false');
				});
			}

			menuButton.addEventListener('click', () => {
				const open = document.body.classList.toggle('navigation-open');
				menuButton.setAttribute('aria-expanded', String(open));
			});
			printButton.addEventListener('click', () => window.print());
			backToTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
			window.addEventListener('scroll', updateProgress, { passive: true });
			updateProgress();
		})();
	</script>
</body>
</html>
`;

await writeFile(outputPath, html, 'utf8');
console.log(`Rendered ${path.relative(repositoryRoot, outputPath)} (${Buffer.byteLength(html).toLocaleString()} bytes)`);
