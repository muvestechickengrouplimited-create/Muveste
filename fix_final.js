const fs = require('fs');

function fixFinancePage() {
  const file = 'app/(dashboard)/finance/page.tsx';
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(
    /broilerRevenue: '', broilerExpenses: '',\r?\n\s*butcherRevenue: '', butcherExpenses: '',/g,
    `broilerRevenue: '', broilerExpenses: '',\n    kibungoRevenue: '', kibungoExpenses: '',\n    rwamaganaRevenue: '', rwamaganaExpenses: '',\n    nyabugogoRevenue: '', nyabugogoExpenses: '',`
  );
  fs.writeFileSync(file, content, 'utf8');
}

function fixAdminPage() {
  const file = 'app/(dashboard)/admin/page.tsx';
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(
    /butcherRevenue\?: number;\r?\n\s*butcherExpenses\?: number;\r?\n\s*butcherProfit\?: number;/g,
    `kibungoRevenue?: number;\n  kibungoExpenses?: number;\n  kibungoProfit?: number;\n  rwamaganaRevenue?: number;\n  rwamaganaExpenses?: number;\n  rwamaganaProfit?: number;\n  nyabugogoRevenue?: number;\n  nyabugogoExpenses?: number;\n  nyabugogoProfit?: number;`
  );
  fs.writeFileSync(file, content, 'utf8');
}

fixFinancePage();
fixAdminPage();
console.log('Fixed');
