import fs from 'fs';
import path from 'path';

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

walkDir('src', (filePath) => {
  if (!filePath.endsWith('.tsx') && !filePath.endsWith('.ts')) return;
  
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;
  
  // Replace import ... from "@/services/lotteryApi"
  const regex = /import \{ ([^}]+) \} from ["']@\/services\/lotteryApi["']/g;
  if (regex.test(content)) {
    content = content.replace(regex, (match, imports) => {
      // Split imports and check which ones should go to LotteryApi or lottery-utils
      const importList = imports.split(',').map(i => i.trim());
      
      const apiImports = [];
      const utilsImports = [];
      
      importList.forEach(name => {
        if (['MatchResult', 'checkBetAgainstDraws', 'getPrizeTiers', 'fetchLatestDraw', 'LatestDrawResult'].includes(name)) {
          apiImports.push(name);
        } else {
          utilsImports.push(name);
        }
      });
      
      let newImport = '';
      if (apiImports.length > 0) {
        newImport += `import { ${apiImports.join(', ')} } from "@/services/api/lottery";\n`;
      }
      if (utilsImports.length > 0) {
        newImport += `import { ${utilsImports.join(', ')} } from "@/utils/lottery-utils";\n`;
      }
      return newImport.trim();
    });
    changed = true;
  }
  
  if (changed) {
    fs.writeFileSync(filePath, content);
    console.log(`Updated legacy imports in ${filePath}`);
  }
});
