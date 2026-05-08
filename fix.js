const fs = require('fs');

const file = 'app/(dashboard)/finance/page.tsx';
let content = fs.readFileSync(file, 'utf8');

const regex = /\{\s*name:\s*'Butchery Kibungo',\s*'Butchery Rwamagana',\s*'Butchery Nyabugogo',\s*color:\s*'#2D2D2D',\s*revKey:\s*'butcherRevenue',\s*expKey:\s*'butcherExpenses',\s*profKey:\s*'butcherProfit'\s*\}/g;

const replacement = `{ name: 'Butchery Kibungo', color: '#2D2D2D', revKey: 'kibungoRevenue', expKey: 'kibungoExpenses', profKey: 'kibungoProfit' },
                      { name: 'Butchery Rwamagana', color: '#2D2D2D', revKey: 'rwamaganaRevenue', expKey: 'rwamaganaExpenses', profKey: 'rwamaganaProfit' },
                      { name: 'Butchery Nyabugogo', color: '#2D2D2D', revKey: 'nyabugogoRevenue', expKey: 'nyabugogoExpenses', profKey: 'nyabugogoProfit' }`;

content = content.replace(regex, replacement);

content = content.replace(/staticDepts\[0\], \/\/ Butchery/g, '...staticDepts');

fs.writeFileSync(file, content, 'utf8');
console.log('Fixed');
