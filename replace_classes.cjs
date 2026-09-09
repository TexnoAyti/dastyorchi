const fs = require('fs');
const path = require('path');

function processDir(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      processDir(fullPath);
    } else if (entry.isFile() && fullPath.endsWith('.tsx')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      const replacements = {
        '150': '200',
        '250': '200',
        '450': '400',
        '550': '500',
        '650': '600',
        '850': '800'
      };

      const regex = /\b(slate|zinc|gray|blue|red|indigo|emerald|amber|orange|rose|purple|teal|cyan|violet|fuchsia|pink|yellow|sky|green)-(150|250|450|550|650|850)\b/g;
      
      content = content.replace(regex, (match, color, num) => `${color}-${replacements[num]}`);
      
      fs.writeFileSync(fullPath, content);
    }
  }
}

processDir(path.join(__dirname, 'src'));
console.log('Done!');
