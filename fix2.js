const fs = require('fs');

const file = 'app/(dashboard)/finance/page.tsx';
let content = fs.readFileSync(file, 'utf8');

const regex = /const buR = Number\(fields\.butcherRevenue\) \|\| 0;\r?\n\s*const buE = \(trackerData\['Butchery'\]\?\.value \|\| 0\) \+ \(financeExtras\['Butchery'\] \|\| 0\);\r?\n\r?\n\s*const tRev = bfR \+ buR;\r?\n\s*const tExp = grandTotalExpenses;/g;

const replacement = `const bkR = Number(fields.kibungoRevenue) || 0;
    const bkE = (trackerData['Butchery Kibungo']?.value || 0) + (financeExtras['Butchery Kibungo'] || 0);
    const brR = Number(fields.rwamaganaRevenue) || 0;
    const brE = (trackerData['Butchery Rwamagana']?.value || 0) + (financeExtras['Butchery Rwamagana'] || 0);
    const bnR = Number(fields.nyabugogoRevenue) || 0;
    const bnE = (trackerData['Butchery Nyabugogo']?.value || 0) + (financeExtras['Butchery Nyabugogo'] || 0);

    const buR = bkR + brR + bnR;
    const buE = bkE + brE + bnE;

    const tRev = bfR + buR;
    const tExp = grandTotalExpenses;`;

content = content.replace(regex, replacement);

fs.writeFileSync(file, content, 'utf8');
console.log('Fixed finance useMemo');
