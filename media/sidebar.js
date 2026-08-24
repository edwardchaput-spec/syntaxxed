'use strict';

const vscode = acquireVsCodeApi();

const elements = {
	files: document.getElementById('statFiles'),
	saved: document.getElementById('statSaved'),
	before: document.getElementById('statBefore'),
	after: document.getElementById('statAfter'),
	list: document.getElementById('fileList'),
	count: document.getElementById('fileCountLabel'),
	status: document.getElementById('status'),
	build: document.getElementById('btnBuild'),
	refresh: document.getElementById('btnRefresh'),
	selectAll: document.getElementById('btnSelectAll'),
	selectNone: document.getElementById('btnSelectNone'),
	detail: document.getElementById('contextDetail'),
	budgetWarning: document.getElementById('budgetWarning'),
	budgetWarningText: document.getElementById('budgetWarningText'),
	useOutline: document.getElementById('btnUseOutline'),
	roiSessionOriginal: document.getElementById('roiSessionOriginal'),
	roiSessionPrepared: document.getElementById('roiSessionPrepared'),
	roiSessionReduction: document.getElementById('roiSessionReduction'),
	roiSessionMoney: document.getElementById('roiSessionMoney'),
	roiMeta: document.getElementById('roiMeta'),
	resetStats: document.getElementById('btnResetStats'),
	redactionSummary: document.getElementById('redactionSummary'),
	redactionSettings: document.getElementById('btnRedactionSettings'),
	secretAlert: document.getElementById('secretAlert'),
	intent: document.getElementById('intentInput'),
};

/** @type {{ relativePath: string, originalTokens: number, preparedTokens: number, included: boolean }[]} */
let files = [];

/** @type {Record<string, string>} */
let matchReasons = {};

function formatNumber(value) {
	return Number(value || 0).toLocaleString();
}

function formatMoney(value) {
	const amount = Number(value || 0);
	if (amount > 0 && amount < 0.01) {
		return '<$0.01';
	}
	return `~$${amount.toLocaleString('en-US', {
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	})}`;
}

function selectedPaths() {
	return files.filter((file) => file.included).map((file) => file.relativePath);
}

function currentDetail() {
	const value = elements.detail.value;
	return value === 'outline' || value === 'source' ? value : 'logic';
}

function setBusy(isBusy) {
	elements.build.disabled = isBusy;
	elements.refresh.disabled = isBusy;
}

function setStatus(state, message) {
	elements.status.textContent = message || '';
	elements.status.className =
		'status' +
		(state === 'error' || state === 'success' ? ` ${state}` : '');
	setBusy(state === 'loading');
}

function renderStats(data) {
	const original = Number(data.sessionOriginal || 0);
	const prepared = Number(data.sessionPrepared || 0);
	const saved = Number(data.sessionSaved || 0);
	const reduction = original > 0 ? (saved / original) * 100 : 0;
	const rate = Number(data.inputCostPerMillionTokens || 0);
	const buildCount = Number(data.sessionBuildCount || 0);
	const secretCount = Number(data.sessionSecrets || 0);

	elements.roiSessionOriginal.textContent = formatNumber(original);
	elements.roiSessionPrepared.textContent = formatNumber(prepared);
	elements.roiSessionReduction.textContent = `${reduction.toFixed(1)}%`;
	elements.roiSessionMoney.textContent = formatMoney((saved / 1_000_000) * rate);
	elements.roiSessionMoney.title =
		`Estimated at $${rate.toFixed(2)} per 1 million input tokens.`;

	if (buildCount === 0) {
		elements.roiMeta.textContent =
			`No context built this session | $${rate.toFixed(2)}/M input estimate`;
	} else {
		elements.roiMeta.textContent =
			`${buildCount} build${buildCount === 1 ? '' : 's'} | ` +
			`${formatNumber(saved)} tokens removed | ` +
			`${formatNumber(secretCount)} potential secrets redacted | ` +
			`${formatNumber(data.workspaceSaved)} workspace / ` +
			`${formatNumber(data.lifetimeSaved)} lifetime`;
	}

	const ruleCount = Number(data.customRedactionRuleCount || 0);
	const invalidCount = Number(data.invalidCustomRedactionRuleCount || 0);
	elements.redactionSummary.classList.toggle('warning', invalidCount > 0);
	elements.redactionSummary.textContent =
		`Built-in + ${ruleCount} custom rule${ruleCount === 1 ? '' : 's'}` +
		(invalidCount > 0
			? ` | ${invalidCount} invalid ignored`
			: '');
}

function showSecretAlert(count) {
	if (!count || count <= 0) {
		elements.secretAlert.hidden = true;
		elements.secretAlert.textContent = '';
		return;
	}

	elements.secretAlert.hidden = false;
	elements.secretAlert.textContent =
		`${formatNumber(count)} potential secret${count === 1 ? '' : 's'} ` +
		`${count === 1 ? 'was' : 'were'} detected and redacted from the prepared context.`;
}

function renderSummary(data) {
	elements.files.textContent = formatNumber(data.fileCount);
	elements.before.textContent = formatNumber(data.originalTokens);
	elements.after.textContent = formatNumber(data.preparedTokens);

	const tokenBudgetExceeded =
		Boolean(data.tokenBudgetExceeded) ||
		data.payloadTokens > data.tokenBudget;
	elements.after.classList.toggle('warning', tokenBudgetExceeded);
	elements.budgetWarning.hidden = !tokenBudgetExceeded;
	elements.useOutline.hidden = true;
	if (tokenBudgetExceeded) {
		const detailName =
			data.currentDetail === 'source' ? 'Source' :
				data.currentDetail === 'outline' ? 'Outline' : 'Logic';
		let warning =
			`High token payload (~${formatNumber(data.payloadTokens)} tokens, ` +
			`${formatMoney(data.estimatedPayloadCost)} estimated input).`;
		if (data.recommendedDetail === 'outline' && data.recommendedTokens !== null) {
			warning +=
				` Switch from ${detailName} to Outline to remove implementation bodies and reduce the context to ` +
				`~${formatNumber(data.recommendedTokens)} tokens and save ` +
				`~${formatNumber(data.potentialTokensSaved)} tokens ` +
				`(${formatMoney(data.potentialMoneySaved)} on this prompt).`;
			elements.useOutline.hidden = false;
		} else {
			warning += ` The configured warning limit is ~${formatNumber(data.tokenBudget)} tokens; deselect files to reduce it.`;
		}
		elements.budgetWarningText.textContent = warning;
	} else {
		elements.budgetWarningText.textContent = '';
	}
	elements.saved.textContent = `${data.percentSaved || 0}%`;
	elements.count.textContent =
		`${files.length} file${files.length === 1 ? '' : 's'}` +
		(data.skippedCount ? ` | ${data.skippedCount} skipped` : '');
}

function createPreviewButton(relativePath) {
	const button = document.createElement('button');
	button.type = 'button';
	button.className = 'preview-btn';
	button.title = 'Preview prepared context';
	button.setAttribute('aria-label', `Preview ${relativePath}`);

	button.textContent = 'Preview';

	button.addEventListener('click', (event) => {
		event.preventDefault();
		event.stopPropagation();
		vscode.postMessage({
			type: 'preview',
			relativePath,
			detail: currentDetail(),
		});
	});

	return button;
}

function createFileRow(file) {
	const relativePath = file.relativePath || '';
	const row = document.createElement('div');
	row.className = 'file';
	row.setAttribute('role', 'listitem');

	const checkLabel = document.createElement('label');
	checkLabel.className = 'file-check';
	checkLabel.setAttribute('aria-label', `Include ${relativePath}`);

	const checkbox = document.createElement('input');
	checkbox.type = 'checkbox';
	checkbox.checked = Boolean(file.included);
	checkbox.addEventListener('change', () => {
		file.included = checkbox.checked;
		vscode.postMessage({
			type: 'toggleFile',
			relativePath,
			included: file.included,
		});
	});
	checkLabel.appendChild(checkbox);

	const main = document.createElement('div');
	main.className = 'file-main';

	const pathElement = document.createElement('div');
	pathElement.className = 'path';
	pathElement.title = relativePath;
	pathElement.textContent = relativePath;

	const tokens = document.createElement('div');
	tokens.className = 'tokens';
	tokens.textContent =
		`${formatNumber(file.originalTokens)} -> ` +
		`${formatNumber(file.preparedTokens)} tokens`;

	const reason = matchReasons[relativePath];
	if (reason) {
		const reasonElement = document.createElement('span');
		reasonElement.className = 'match-reason';
		reasonElement.textContent = reason;
		tokens.appendChild(reasonElement);
	}

	main.append(pathElement, tokens);
	row.append(checkLabel, main, createPreviewButton(relativePath));
	return row;
}

function renderList() {
	elements.list.replaceChildren();

	if (files.length === 0) {
		const empty = document.createElement('div');
		empty.className = 'empty';
		empty.textContent =
			'No eligible files found. Open a workspace and rescan.';
		elements.list.appendChild(empty);
		return;
	}

	const fragment = document.createDocumentFragment();
	for (const file of files) {
		fragment.appendChild(createFileRow(file));
	}
	elements.list.appendChild(fragment);
}

elements.build.addEventListener('click', () => {
	vscode.postMessage({
		type: 'build',
		paths: selectedPaths(),
		detail: currentDetail(),
	});
});

elements.detail.addEventListener('change', () => {
	vscode.postMessage({
		type: 'detailChange',
		detail: currentDetail(),
	});
});

elements.useOutline.addEventListener('click', () => {
	elements.detail.value = 'outline';
	vscode.postMessage({ type: 'detailChange', detail: 'outline' });
});

elements.refresh.addEventListener('click', () => {
	vscode.postMessage({ type: 'refresh' });
});

elements.selectAll.addEventListener('click', () => {
	vscode.postMessage({ type: 'setAll', included: true });
});

elements.selectNone.addEventListener('click', () => {
	vscode.postMessage({ type: 'setAll', included: false });
});

elements.resetStats.addEventListener('click', () => {
	vscode.postMessage({ type: 'resetStats' });
});

elements.redactionSettings.addEventListener('click', () => {
	vscode.postMessage({ type: 'openRedactionSettings' });
});

let intentDebounce;
elements.intent.addEventListener('input', () => {
	clearTimeout(intentDebounce);
	intentDebounce = setTimeout(() => {
		vscode.postMessage({
			type: 'searchIntent',
			query: elements.intent.value,
		});
	}, 300);
});

window.addEventListener('message', (event) => {
	const message = event.data;
	if (!message || typeof message !== 'object' || !message.type) {
		return;
	}

	switch (message.type) {
		case 'status':
			setStatus(message.state, message.message);
			break;
		case 'stats':
			renderStats(message);
			break;
		case 'secretAlert':
			showSecretAlert(message.count);
			break;
		case 'autoSelectFiles': {
			const results = Array.isArray(message.results) ? message.results : [];
			const matched = new Map(
				results.map((result) => [result.path, result.reason || ''])
			);

			matchReasons = {};
			for (const file of files) {
				file.included = matched.has(file.relativePath);
				const reason = matched.get(file.relativePath);
				if (reason) {
					matchReasons[file.relativePath] = reason;
				}
			}
			renderList();
			break;
		}
		case 'scanResult':
			files = Array.isArray(message.files) ? message.files : [];
			renderSummary(message);
			renderList();
			break;
	}
});

vscode.postMessage({ type: 'ready' });
