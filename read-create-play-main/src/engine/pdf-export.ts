import { LotteryConfig } from "@/data/lotteries";

// ═══════════════════════════════════════════════════════
// EXPORTAÇÃO PDF - Layout profissional para impressão
// Gera PDF nativo sem dependências externas
// ═══════════════════════════════════════════════════════

interface ExportBet {
  numbers: number[];
  strategy?: string;
  score?: number;
  grade?: string;
}

interface ExportOptions {
  title: string;
  subtitle?: string;
  config: LotteryConfig;
  bets: ExportBet[];
  includeDate?: boolean;
  type: "apostas" | "fechamento";
}

function escapeHtml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export function exportToPdf(options: ExportOptions): void {
  const { title, subtitle, config, bets, type } = options;
  const date = new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });

  const ballsHtml = (numbers: number[]) =>
    numbers.map(n =>
      `<span style="display:inline-flex;align-items:center;justify-content:center;width:32px;height:32px;border-radius:50%;background:linear-gradient(135deg,#22c55e,#16a34a);color:#fff;font-weight:700;font-size:13px;font-family:'JetBrains Mono',monospace;margin:2px;box-shadow:0 2px 4px rgba(0,0,0,0.2);">${String(n).padStart(2, "0")}</span>`
    ).join("");

  const rows = bets.map((bet, i) => {
    const meta = [];
    if (bet.strategy) meta.push(escapeHtml(bet.strategy));
    if (bet.grade) meta.push(`<strong>${bet.grade}</strong>`);
    if (bet.score != null) meta.push(`${bet.score}pts`);

    return `
      <tr style="border-bottom:1px solid #e5e7eb;">
        <td style="padding:10px 8px;font-family:'JetBrains Mono',monospace;font-size:13px;color:#6b7280;text-align:center;width:40px;">
          ${type === "fechamento" ? `J${i + 1}` : `#${i + 1}`}
        </td>
        <td style="padding:10px 8px;">${ballsHtml(bet.numbers)}</td>
        <td style="padding:10px 8px;font-size:11px;color:#6b7280;text-align:right;white-space:nowrap;">
          ${meta.join(" · ")}
        </td>
      </tr>
    `;
  }).join("");

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${escapeHtml(title)} - Titan Loterias</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&family=Inter:wght@400;500;600;700;800&display=swap');
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Inter', sans-serif; background: #fff; color: #111; }
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .no-print { display: none !important; }
      @page { margin: 15mm; }
    }
  </style>
</head>
<body>
  <div style="max-width:800px;margin:0 auto;padding:30px 20px;">
    <!-- Header -->
    <div style="display:flex;align-items:center;justify-content:space-between;border-bottom:3px solid #22c55e;padding-bottom:16px;margin-bottom:24px;">
      <div>
        <h1 style="font-size:22px;font-weight:800;color:#111;">
          ⚡ Titan <span style="color:#22c55e;">Loterias</span>
        </h1>
        <p style="font-size:11px;color:#6b7280;margin-top:2px;">Motor Estatístico v4.0 • Geração Inteligente</p>
      </div>
      <div style="text-align:right;">
        <p style="font-size:12px;font-weight:600;color:#111;">${escapeHtml(config.name)} ${config.icon}</p>
        <p style="font-size:10px;color:#6b7280;">${date}</p>
      </div>
    </div>

    <!-- Title -->
    <div style="margin-bottom:20px;">
      <h2 style="font-size:17px;font-weight:700;color:#111;">${escapeHtml(title)}</h2>
      ${subtitle ? `<p style="font-size:12px;color:#6b7280;margin-top:4px;">${escapeHtml(subtitle)}</p>` : ""}
      <p style="font-size:11px;color:#9ca3af;margin-top:4px;">
        ${bets.length} ${type === "fechamento" ? "jogos no fechamento" : "apostas geradas"} · 
        ${config.pick} dezenas de 1 a ${config.numbers}
      </p>
    </div>

    <!-- Table -->
    <table style="width:100%;border-collapse:collapse;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;">
      <thead>
        <tr style="background:#f9fafb;">
          <th style="padding:10px 8px;font-size:11px;font-weight:600;color:#6b7280;text-align:center;width:40px;">#</th>
          <th style="padding:10px 8px;font-size:11px;font-weight:600;color:#6b7280;text-align:left;">Dezenas</th>
          <th style="padding:10px 8px;font-size:11px;font-weight:600;color:#6b7280;text-align:right;">Info</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>

    <!-- Footer -->
    <div style="margin-top:24px;padding-top:16px;border-top:1px solid #e5e7eb;display:flex;justify-content:space-between;">
      <p style="font-size:9px;color:#9ca3af;">
        Gerado por Titan Loterias · Os resultados são baseados em análise estatística e não garantem premiação.
      </p>
      <p style="font-size:9px;color:#9ca3af;">Página 1</p>
    </div>

    <!-- Print button -->
    <div class="no-print" style="text-align:center;margin-top:30px;">
      <button onclick="window.print()" style="background:#22c55e;color:#fff;border:none;padding:12px 32px;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer;">
        🖨️ Imprimir / Salvar PDF
      </button>
    </div>
  </div>
</body>
</html>`;

  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const w = window.open(url, "_blank");
  if (w) {
    w.onload = () => URL.revokeObjectURL(url);
  }
}
