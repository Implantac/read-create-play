#!/usr/bin/env node
/**
 * Gera uma página HTML com a matriz de status por teste x navegador
 * a partir do JSON produzido por `playwright merge-reports --reporter json`.
 *
 * Uso: node scripts/e2e-matrix.mjs <merged.json> <output.html>
 */
import { readFileSync, writeFileSync } from "node:fs";

const [, , inputPath, outputPath] = process.argv;
if (!inputPath || !outputPath) {
  console.error("Uso: node scripts/e2e-matrix.mjs <merged.json> <output.html>");
  process.exit(1);
}

const report = JSON.parse(readFileSync(inputPath, "utf8"));

/** @type {Set<string>} */
const browsers = new Set();
/** @type {Map<string, {file: string, title: string, results: Record<string, {status: string, duration: number, error?: string, testId?: string}>}>} */
const rows = new Map();

function walkSuite(suite, filePath) {
  const currentFile = suite.file || filePath || "";
  for (const spec of suite.specs || []) {
    const title = spec.title;
    for (const testRun of spec.tests || []) {
      const project = testRun.projectName || "unknown";
      browsers.add(project);
      const key = `${currentFile}::${title}`;
      if (!rows.has(key)) rows.set(key, { file: currentFile, title, results: {} });
      const last = testRun.results?.[testRun.results.length - 1];
      const status = last?.status || testRun.status || "unknown";
      const duration = last?.duration ?? 0;
      const error = last?.error?.message;
      const testId = testRun.id || spec.id;
      rows.get(key).results[project] = { status, duration, error, testId };
    }
  }
  for (const child of suite.suites || []) walkSuite(child, currentFile);
}

for (const suite of report.suites || []) walkSuite(suite);

const browserList = [...browsers].sort();
const statusIcon = { passed: "✅", failed: "❌", timedOut: "⏱️", skipped: "⏭️", interrupted: "⚠️", unknown: "—" };
const statusColor = { passed: "#16a34a", failed: "#dc2626", timedOut: "#dc2626", skipped: "#6b7280", interrupted: "#f59e0b", unknown: "#9ca3af" };

const totals = Object.fromEntries(browserList.map((b) => [b, { passed: 0, failed: 0, skipped: 0, other: 0 }]));
for (const { results } of rows.values()) {
  for (const b of browserList) {
    const s = results[b]?.status || "unknown";
    if (s === "passed") totals[b].passed++;
    else if (s === "failed" || s === "timedOut") totals[b].failed++;
    else if (s === "skipped") totals[b].skipped++;
    else totals[b].other++;
  }
}

const escape = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

const headerCells = browserList.map((b) => `<th>${escape(b)}</th>`).join("");
const summaryCells = browserList
  .map((b) => {
    const t = totals[b];
    return `<td class="summary">
      <span style="color:${statusColor.passed}">${t.passed}✅</span>
      <span style="color:${statusColor.failed}">${t.failed}❌</span>
      <span style="color:${statusColor.skipped}">${t.skipped}⏭️</span>
      ${t.other ? `<span style="color:${statusColor.unknown}">${t.other}—</span>` : ""}
    </td>`;
  })
  .join("");

const reportUrl = (params) => `index.html#?${new URLSearchParams(params).toString()}`;

const bodyRows = [...rows.values()]
  .sort((a, b) => (a.file + a.title).localeCompare(b.file + b.title))
  .map(({ file, title, results }) => {
    const cells = browserList
      .map((b) => {
        const r = results[b];
        const s = r?.status || "unknown";
        const icon = statusIcon[s] || "—";
        const dur = r?.duration ? ` <small>${(r.duration / 1000).toFixed(2)}s</small>` : "";
        const tooltip = r?.error ? ` title="${escape(r.error).slice(0, 400)}"` : "";
        const inner = `${icon}${dur}`;
        const linked = r?.testId
          ? `<a href="${escape(reportUrl({ testId: r.testId }))}" style="color:inherit;text-decoration:none">${inner}</a>`
          : inner;
        return `<td class="status" style="color:${statusColor[s] || "#111"}"${tooltip}>${linked}</td>`;
      })
      .join("");
    const fileLink = file ? `<a href="${escape(reportUrl({ q: `file:${file}` }))}" style="color:inherit">${escape(file)}</a>` : "";
    const titleLink = `<a href="${escape(reportUrl({ q: title }))}" style="color:inherit">${escape(title)}</a>`;
    return `<tr>
      <td class="file">${fileLink}</td>
      <td class="title">${titleLink}</td>
      ${cells}
    </tr>`;
  })
  .join("\n");

const html = `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <title>Matriz E2E — Titan Loterias</title>
  <style>
    body { font: 14px system-ui, -apple-system, "Segoe UI", sans-serif; margin: 24px; color: #111; background: #fafafa; }
    h1 { margin: 0 0 4px; font-size: 20px; }
    .meta { color: #6b7280; margin-bottom: 16px; font-size: 12px; }
    table { border-collapse: collapse; background: #fff; box-shadow: 0 1px 3px rgba(0,0,0,.06); width: 100%; }
    th, td { border: 1px solid #e5e7eb; padding: 8px 10px; text-align: left; vertical-align: top; }
    th { background: #f3f4f6; font-weight: 600; position: sticky; top: 0; }
    td.file { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 12px; color: #6b7280; white-space: nowrap; }
    td.title { font-weight: 500; }
    td.status { text-align: center; font-weight: 600; white-space: nowrap; }
    td.status small { color: #6b7280; font-weight: 400; margin-left: 4px; }
    td.summary { text-align: center; font-weight: 600; }
    td.summary span { margin: 0 4px; }
    tfoot td { background: #f9fafb; }
  </style>
</head>
<body>
  <h1>Matriz E2E — status por navegador</h1>
  <div class="meta">
    Gerado em ${new Date().toISOString()} · ${rows.size} teste(s) · ${browserList.length} navegador(es)
    <br /><small>Links abrem a seção do teste no <code>index.html</code> ao lado (funcionam dentro do artefato <strong>playwright-report-merged</strong>).</small>
  </div>
  <table>
    <thead>
      <tr>
        <th>Arquivo</th>
        <th>Teste</th>
        ${headerCells}
      </tr>
    </thead>
    <tbody>
${bodyRows}
    </tbody>
    <tfoot>
      <tr>
        <td colspan="2"><strong>Totais</strong></td>
        ${summaryCells}
      </tr>
    </tfoot>
  </table>
</body>
</html>`;

writeFileSync(outputPath, html);
console.log(`Matriz gerada: ${outputPath} (${rows.size} testes × ${browserList.length} navegadores)`);
