import { readFileSync, readdirSync, statSync, writeFileSync } from 'fs';
import { join, extname } from 'path';

const FORBIDDEN_WORDS = [/mensal/i, /premium/i, /\bpro\b/i];
const IGNORE_DIRS = ['node_modules', '.git', 'dist', 'supabase', 'test', '__tests__'];
const IGNORE_FILES = ['audit-plans.js', 'AuthContext.tsx', 'usePlanAccess.ts', 'AdminPage.tsx', 'ml-models.ts'];
const VALID_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx', '.json'];

const report = [];

function scanDir(dir) {
  const files = readdirSync(dir);
  let issues = 0;

  for (const file of files) {
    const path = join(dir, file);
    const stat = statSync(path);

    if (stat.isDirectory()) {
      if (!IGNORE_DIRS.includes(file)) {
        issues += scanDir(path);
      }
    } else {
      if (VALID_EXTENSIONS.includes(extname(file)) && !IGNORE_FILES.includes(file)) {
        const content = readFileSync(path, 'utf8');
        const lines = content.split('\n');

        lines.forEach((line, index) => {
          if (line.trim().startsWith('//') || line.trim().startsWith('import') || line.trim().startsWith('*')) return;
          
          FORBIDDEN_WORDS.forEach(regex => {
            if (regex.test(line)) {
              const issue = `[BLOQUEIO] ${path}:${index + 1} -> ${line.trim()}`;
              console.log(issue);
              report.push(issue);
              issues++;
            }
          });
        });
      }
    }
  }
  return issues;
}

console.log('--- Iniciando Auditoria de Planos ---');
const totalIssues = scanDir('./src');

if (report.length > 0) {
  writeFileSync('audit-report.txt', report.join('\n'), 'utf8');
  console.log(`\nRelatório gerado em: audit-report.txt`);
}

console.log(`--- Auditoria Finalizada: ${totalIssues} ocorrência(s) encontrada(s) ---`);

if (totalIssues > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
