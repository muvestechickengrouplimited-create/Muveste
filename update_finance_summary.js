const fs = require('fs');

function updateFinanceApiRoute() {
  const file = 'app/api/finance/route.ts';
  let content = fs.readFileSync(file, 'utf8');

  content = content.replace(
    /const \{\n      date,\n      broilerRevenue, broilerExpenses,\n      butcherRevenue, butcherExpenses,\n    \} = body;/g,
    `const {\n      date,\n      broilerRevenue, broilerExpenses,\n      kibungoRevenue, kibungoExpenses,\n      rwamaganaRevenue, rwamaganaExpenses,\n      nyabugogoRevenue, nyabugogoExpenses,\n    } = body;`
  );

  content = content.replace(
    /const bfRev = parseNum\(broilerRevenue\);    const bfExp = parseNum\(broilerExpenses\);    const bfProf = bfRev - bfExp;\n    const buRev = parseNum\(butcherRevenue\);    const buExp = parseNum\(butcherExpenses\);    const buProf = buRev - buExp;\n\n    const totalRev = bfRev \+ buRev;\n    const totalExp = bfExp \+ buExp;\n    const netProf = totalRev - totalExp;/g,
    `const bfRev = parseNum(broilerRevenue);    const bfExp = parseNum(broilerExpenses);    const bfProf = bfRev - bfExp;\n    const bkRev = parseNum(kibungoRevenue);    const bkExp = parseNum(kibungoExpenses);    const bkProf = bkRev - bkExp;\n    const brRev = parseNum(rwamaganaRevenue);    const brExp = parseNum(rwamaganaExpenses);    const brProf = brRev - brExp;\n    const bnRev = parseNum(nyabugogoRevenue);    const bnExp = parseNum(nyabugogoExpenses);    const bnProf = bnRev - bnExp;\n\n    const totalRev = bfRev + bkRev + brRev + bnRev;\n    const totalExp = bfExp + bkExp + brExp + bnExp;\n    const netProf = totalRev - totalExp;`
  );

  content = content.replace(
    /const newRow = \[\n      date,\n      bfRev, bfExp, bfProf,\n      buRev, buExp, buProf,\n      totalRev, totalExp, netProf,\n      now\.toISOString\(\),\n    \];/g,
    `const newRow = [\n      date,\n      bfRev, bfExp, bfProf,\n      bkRev, bkExp, bkProf,\n      brRev, brExp, brProf,\n      bnRev, bnExp, bnProf,\n      totalRev, totalExp, netProf,\n      now.toISOString(),\n    ];`
  );

  content = content.replace(
    /return \{\n        date: dateStr,\n        broilerRevenue: bfTotalRev, broilerExpenses: bfTotalExp, broilerProfit: bfProf,\n        butcherRevenue: buRev, butcherExpenses: buExp, butcherProfit: buProf,\n        totalRevenue: tRev, totalExpenses: tExp, netProfit: tRev - tExp,\n        timestamp: '',\n        \.\.\.batchFields,\n      \};/g,
    `return {\n        date: dateStr,\n        broilerRevenue: bfTotalRev, broilerExpenses: bfTotalExp, broilerProfit: bfProf,\n        kibungoRevenue: bkRev, kibungoExpenses: bkExp, kibungoProfit: bkRev - bkExp,\n        rwamaganaRevenue: brRev, rwamaganaExpenses: brExp, rwamaganaProfit: brRev - brExp,\n        nyabugogoRevenue: bnRev, nyabugogoExpenses: bnExp, nyabugogoProfit: bnRev - bnExp,\n        totalRevenue: tRev, totalExpenses: tExp, netProfit: tRev - tExp,\n        timestamp: '',\n        ...batchFields,\n      };`
  );

  fs.writeFileSync(file, content, 'utf8');
}

function updateAdminFinanceApiRoute() {
  const file = 'app/api/admin/finance/route.ts';
  let content = fs.readFileSync(file, 'utf8');

  content = content.replace(
    /const formatRow = \(r: string\[\]\) => \(\{\n      date: r\[0\] \|\| '',\n      broilerRevenue: Number\(r\[1\]\) \|\| 0, broilerExpenses: Number\(r\[2\]\) \|\| 0, broilerProfit: Number\(r\[3\]\) \|\| 0,\n      butcherRevenue: Number\(r\[4\]\) \|\| 0, butcherExpenses: Number\(r\[5\]\) \|\| 0, butcherProfit: Number\(r\[6\]\) \|\| 0,\n      totalRevenue: Number\(r\[7\]\) \|\| 0, totalExpenses: Number\(r\[8\]\) \|\| 0, netProfit: Number\(r\[9\]\) \|\| 0,\n      timestamp: r\[10\] \|\| ''\n    \}\);/g,
    `const formatRow = (r: string[]) => ({\n      date: r[0] || '',\n      broilerRevenue: Number(r[1]) || 0, broilerExpenses: Number(r[2]) || 0, broilerProfit: Number(r[3]) || 0,\n      kibungoRevenue: Number(r[4]) || 0, kibungoExpenses: Number(r[5]) || 0, kibungoProfit: Number(r[6]) || 0,\n      rwamaganaRevenue: Number(r[7]) || 0, rwamaganaExpenses: Number(r[8]) || 0, rwamaganaProfit: Number(r[9]) || 0,\n      nyabugogoRevenue: Number(r[10]) || 0, nyabugogoExpenses: Number(r[11]) || 0, nyabugogoProfit: Number(r[12]) || 0,\n      totalRevenue: Number(r[13]) || 0, totalExpenses: Number(r[14]) || 0, netProfit: Number(r[15]) || 0,\n      timestamp: r[16] || ''\n    });`
  );

  fs.writeFileSync(file, content, 'utf8');
}

function updateFinancePage() {
  const file = 'app/(dashboard)/finance/page.tsx';
  let content = fs.readFileSync(file, 'utf8');

  content = content.replace(
    /butcherRevenue: number; butcherExpenses: number; butcherProfit: number;/g,
    `kibungoRevenue: number; kibungoExpenses: number; kibungoProfit: number;\n  rwamaganaRevenue: number; rwamaganaExpenses: number; rwamaganaProfit: number;\n  nyabugogoRevenue: number; nyabugogoExpenses: number; nyabugogoProfit: number;`
  );

  content = content.replace(
    /\{\/\* Kiosk Batsinda \*\/\}\n      <td className="p-2 font-mono text-gray-600">\{p\(row\.kioskBatsindaRevenue\)\}<\/td>\n      <td className="p-2 font-mono text-gray-600">\{p\(row\.kioskBatsindaExpenses\)\}<\/td>\n      <td className={`p-2 font-mono border-r \$\{profitTextColor\(row\.kioskBatsindaProfit\)\}`}>\{p\(row\.kioskBatsindaProfit\)\}<\/td>\n      \{\/\* Kiosk Nyabugogo \*\/\}\n      <td className="p-2 font-mono text-gray-600">\{p\(row\.kioskNyabugogoRevenue\)\}<\/td>\n      <td className="p-2 font-mono text-gray-600">\{p\(row\.kioskNyabugogoExpenses\)\}<\/td>\n      <td className={`p-2 font-mono border-r \$\{profitTextColor\(row\.kioskNyabugogoProfit\)\}`}>\{p\(row\.kioskNyabugogoProfit\)\}<\/td>\n      \{\/\* Butchery \*\/\}\n      <td className="p-2 font-mono text-gray-600">\{p\(row\.butcherRevenue\)\}<\/td>\n      <td className="p-2 font-mono text-gray-600">\{p\(row\.butcherExpenses\)\}<\/td>\n      <td className={`p-2 font-mono border-r \$\{profitTextColor\(row\.butcherProfit\)\}`}>\{p\(row\.butcherProfit\)\}<\/td>/g,
    `{/* Kibungo */}\n      <td className="p-2 font-mono text-gray-600">{p(row.kibungoRevenue)}</td>\n      <td className="p-2 font-mono text-gray-600">{p(row.kibungoExpenses)}</td>\n      <td className={\`p-2 font-mono border-r \${profitTextColor(row.kibungoProfit)}\`}>{p(row.kibungoProfit)}</td>\n      {/* Rwamagana */}\n      <td className="p-2 font-mono text-gray-600">{p(row.rwamaganaRevenue)}</td>\n      <td className="p-2 font-mono text-gray-600">{p(row.rwamaganaExpenses)}</td>\n      <td className={\`p-2 font-mono border-r \${profitTextColor(row.rwamaganaProfit)}\`}>{p(row.rwamaganaProfit)}</td>\n      {/* Nyabugogo */}\n      <td className="p-2 font-mono text-gray-600">{p(row.nyabugogoRevenue)}</td>\n      <td className="p-2 font-mono text-gray-600">{p(row.nyabugogoExpenses)}</td>\n      <td className={\`p-2 font-mono border-r \${profitTextColor(row.nyabugogoProfit)}\`}>{p(row.nyabugogoProfit)}</td>`
  );

  content = content.replace(
    /<th colSpan=\{3\} className="p-4 font-semibold uppercase tracking-wide text-xs text-center border-r border-\[#1B6B3A\]\/20">Kiosk Batsinda<\/th>\n                            <th colSpan=\{3\} className="p-4 font-semibold uppercase tracking-wide text-xs text-center border-r border-\[#1B6B3A\]\/20">Kiosk Nyabugogo<\/th>\n                            <th colSpan=\{3\} className="p-4 font-semibold uppercase tracking-wide text-xs text-center border-r border-\[#1B6B3A\]\/20">Butchery<\/th>/g,
    `<th colSpan={3} className="p-4 font-semibold uppercase tracking-wide text-xs text-center border-r border-[#1B6B3A]/20">Kibungo</th>\n                            <th colSpan={3} className="p-4 font-semibold uppercase tracking-wide text-xs text-center border-r border-[#1B6B3A]/20">Rwamagana</th>\n                            <th colSpan={3} className="p-4 font-semibold uppercase tracking-wide text-xs text-center border-r border-[#1B6B3A]/20">Nyabugogo</th>`
  );

  content = content.replace(
    /const payload = \{\n        date: formDate,\n        broilerRevenue: bfRev, \n        broilerExpenses: bfExp,\n        butcherRevenue: buRev, \n        butcherExpenses: buExp,\n      \};/g,
    `const bkR = Number(fields.kibungoRevenue) || 0;\n      const bkE = (trackerData['Butchery Kibungo']?.value || 0) + (financeExtras['Butchery Kibungo'] || 0);\n      const brR = Number(fields.rwamaganaRevenue) || 0;\n      const brE = (trackerData['Butchery Rwamagana']?.value || 0) + (financeExtras['Butchery Rwamagana'] || 0);\n      const bnR = Number(fields.nyabugogoRevenue) || 0;\n      const bnE = (trackerData['Butchery Nyabugogo']?.value || 0) + (financeExtras['Butchery Nyabugogo'] || 0);\n\n      const payload = {\n        date: formDate,\n        broilerRevenue: bfRev,\n        broilerExpenses: bfExp,\n        kibungoRevenue: bkR, kibungoExpenses: bkE,\n        rwamaganaRevenue: brR, rwamaganaExpenses: brE,\n        nyabugogoRevenue: bnR, nyabugogoExpenses: bnE,\n      };`
  );

  content = content.replace(
    /'BU Rev', 'BU Exp', 'BU Profit',/g,
    `'KB Rev', 'KB Exp', 'KB Profit',\n      'RW Rev', 'RW Exp', 'RW Profit',\n      'NY Rev', 'NY Exp', 'NY Profit',`
  );

  content = content.replace(
    /r\.butcherRevenue\.toString\(\), r\.butcherExpenses\.toString\(\), r\.butcherProfit\.toString\(\),/g,
    `r.kibungoRevenue.toString(), r.kibungoExpenses.toString(), r.kibungoProfit.toString(),\n      r.rwamaganaRevenue.toString(), r.rwamaganaExpenses.toString(), r.rwamaganaProfit.toString(),\n      r.nyabugogoRevenue.toString(), r.nyabugogoExpenses.toString(), r.nyabugogoProfit.toString(),`
  );

  content = content.replace(
    /let buRev = 0, buExp = 0, buProf = 0;/g,
    `let bkRev = 0, bkExp = 0, bkProf = 0;\n    let brRev = 0, brExp = 0, brProf = 0;\n    let bnRev = 0, bnExp = 0, bnProf = 0;`
  );

  content = content.replace(
    /buRev \+= r\.butcherRevenue \|\| 0; buExp \+= r\.butcherExpenses \|\| 0; buProf \+= r\.butcherProfit \|\| 0;/g,
    `bkRev += r.kibungoRevenue || 0; bkExp += r.kibungoExpenses || 0; bkProf += r.kibungoProfit || 0;\n      brRev += r.rwamaganaRevenue || 0; brExp += r.rwamaganaExpenses || 0; brProf += r.rwamaganaProfit || 0;\n      bnRev += r.nyabugogoRevenue || 0; bnExp += r.nyabugogoExpenses || 0; bnProf += r.nyabugogoProfit || 0;`
  );

  content = content.replace(
    /\{ name: 'Butchery Kibungo',\n    'Butchery Rwamagana',\n    'Butchery Nyabugogo', rev: buRev, exp: buExp, prof: buProf, color: '#2D2D2D' \},/g,
    `{ name: 'Butchery Kibungo', rev: bkRev, exp: bkExp, prof: bkProf, color: '#2D2D2D' },\n      { name: 'Butchery Rwamagana', rev: brRev, exp: brExp, prof: brProf, color: '#2D2D2D' },\n      { name: 'Butchery Nyabugogo', rev: bnRev, exp: bnExp, prof: bnProf, color: '#2D2D2D' },`
  );

  content = content.replace(
    /fields: \{\n    broilerRevenue: '', broilerExpenses: '',\n    butcherRevenue: '', butcherExpenses: '',\n  \}/g,
    `fields: {\n    broilerRevenue: '', broilerExpenses: '',\n    kibungoRevenue: '', kibungoExpenses: '',\n    rwamaganaRevenue: '', rwamaganaExpenses: '',\n    nyabugogoRevenue: '', nyabugogoExpenses: '',\n  }`
  );

  content = content.replace(
    /butcherRevenue: data\.butcherRevenue\?\.toString\(\) \|\| '0',\n          butcherExpenses: data\.butcherExpenses\?\.toString\(\) \|\| '0',/g,
    `kibungoRevenue: data.kibungoRevenue?.toString() || '0',\n          kibungoExpenses: data.kibungoExpenses?.toString() || '0',\n          rwamaganaRevenue: data.rwamaganaRevenue?.toString() || '0',\n          rwamaganaExpenses: data.rwamaganaExpenses?.toString() || '0',\n          nyabugogoRevenue: data.nyabugogoRevenue?.toString() || '0',\n          nyabugogoExpenses: data.nyabugogoExpenses?.toString() || '0',`
  );

  content = content.replace(
    /const buR = Number\(fields\.butcherRevenue\) \|\| 0;\n    const buE = \(trackerData\['Butchery Kibungo'\]\?\.value \|\| 0\) \+ \(financeExtras\['Butchery Kibungo'\] \|\| 0\) \+ \(trackerData\['Butchery Rwamagana'\]\?\.value \|\| 0\) \+ \(financeExtras\['Butchery Rwamagana'\] \|\| 0\) \+ \(trackerData\['Butchery Nyabugogo'\]\?\.value \|\| 0\) \+ \(financeExtras\['Butchery Nyabugogo'\] \|\| 0\);\n\n    const tRev = bfR \+ buR;/g,
    `const bkR = Number(fields.kibungoRevenue) || 0;\n    const bkE = (trackerData['Butchery Kibungo']?.value || 0) + (financeExtras['Butchery Kibungo'] || 0);\n    const brR = Number(fields.rwamaganaRevenue) || 0;\n    const brE = (trackerData['Butchery Rwamagana']?.value || 0) + (financeExtras['Butchery Rwamagana'] || 0);\n    const bnR = Number(fields.nyabugogoRevenue) || 0;\n    const bnE = (trackerData['Butchery Nyabugogo']?.value || 0) + (financeExtras['Butchery Nyabugogo'] || 0);\n\n    const buR = bkR + brR + bnR;\n    const buE = bkE + brE + bnE;\n\n    const tRev = bfR + buR;`
  );

  content = content.replace(
    /buRev: buR, buExp: buE, buProfit: buR - buE,/g,
    `buRev: buR, buExp: buE, buProfit: buR - buE,\n      bkRev: bkR, bkExp: bkE, bkProfit: bkR - bkE,\n      brRev: brR, brExp: brE, brProfit: brR - brE,\n      bnRev: bnR, bnExp: bnE, bnProfit: bnR - bnE,`
  );

  const blockToReplace = `<div className="space-y-4 pt-4 border-t border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center">
                    <span className="text-xl">🥩</span>
                  </div>
                  <h3 className="font-semibold text-gray-700">Butchery</h3>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-gray-500 mb-1.5 block">Revenue</label>
                    <Input
                      type="number" placeholder="0"
                      value={fields.butcherRevenue}
                      onChange={e => setFields(prev => ({ ...prev, butcherRevenue: e.target.value }))}
                      className="bg-gray-50/50"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1.5 block">Reported Expenses</label>
                    <Input
                      type="text" value={formatRWF(buExp)} disabled
                      className="bg-gray-100 border-transparent font-mono text-gray-600"
                    />
                  </div>
                </div>
              </div>`;

  const newBlock = `<div className="space-y-4 pt-4 border-t border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center">
                    <span className="text-xl">🥩</span>
                  </div>
                  <h3 className="font-semibold text-gray-700">Butchery Kibungo</h3>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-gray-500 mb-1.5 block">Revenue</label>
                    <Input
                      type="number" placeholder="0"
                      value={fields.kibungoRevenue}
                      onChange={e => setFields(prev => ({ ...prev, kibungoRevenue: e.target.value }))}
                      className="bg-gray-50/50"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1.5 block">Reported Expenses</label>
                    <Input
                      type="text" value={formatRWF(bkE)} disabled
                      className="bg-gray-100 border-transparent font-mono text-gray-600"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center">
                    <span className="text-xl">🥩</span>
                  </div>
                  <h3 className="font-semibold text-gray-700">Butchery Rwamagana</h3>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-gray-500 mb-1.5 block">Revenue</label>
                    <Input
                      type="number" placeholder="0"
                      value={fields.rwamaganaRevenue}
                      onChange={e => setFields(prev => ({ ...prev, rwamaganaRevenue: e.target.value }))}
                      className="bg-gray-50/50"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1.5 block">Reported Expenses</label>
                    <Input
                      type="text" value={formatRWF(brE)} disabled
                      className="bg-gray-100 border-transparent font-mono text-gray-600"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center">
                    <span className="text-xl">🥩</span>
                  </div>
                  <h3 className="font-semibold text-gray-700">Butchery Nyabugogo</h3>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-gray-500 mb-1.5 block">Revenue</label>
                    <Input
                      type="number" placeholder="0"
                      value={fields.nyabugogoRevenue}
                      onChange={e => setFields(prev => ({ ...prev, nyabugogoRevenue: e.target.value }))}
                      className="bg-gray-50/50"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1.5 block">Reported Expenses</label>
                    <Input
                      type="text" value={formatRWF(bnE)} disabled
                      className="bg-gray-100 border-transparent font-mono text-gray-600"
                    />
                  </div>
                </div>
              </div>`;

  content = content.replace(blockToReplace, newBlock);

  fs.writeFileSync(file, content, 'utf8');
}

function updateAdminPage() {
  const file = 'app/(dashboard)/admin/page.tsx';
  let content = fs.readFileSync(file, 'utf8');

  content = content.replace(
    /butcherRevenue\?: number;\n  butcherExpenses\?: number;\n  butcherProfit\?: number;/g,
    `kibungoRevenue?: number;\n  kibungoExpenses?: number;\n  kibungoProfit?: number;\n  rwamaganaRevenue?: number;\n  rwamaganaExpenses?: number;\n  rwamaganaProfit?: number;\n  nyabugogoRevenue?: number;\n  nyabugogoExpenses?: number;\n  nyabugogoProfit?: number;`
  );

  content = content.replace(
    /let buRev = 0, buExp = 0, buProf = 0;/g,
    `let bkRev = 0, bkExp = 0, bkProf = 0;\n                            let brRev = 0, brExp = 0, brProf = 0;\n                            let bnRev = 0, bnExp = 0, bnProf = 0;`
  );

  content = content.replace(
    /buRev \+= Number\(r\.butcherRevenue\) \|\| 0; buExp \+= Number\(r\.butcherExpenses\) \|\| 0; buProf \+= Number\(r\.butcherProfit\) \|\| 0;/g,
    `bkRev += Number(r.kibungoRevenue) || 0; bkExp += Number(r.kibungoExpenses) || 0; bkProf += Number(r.kibungoProfit) || 0;\n                              brRev += Number(r.rwamaganaRevenue) || 0; brExp += Number(r.rwamaganaExpenses) || 0; brProf += Number(r.rwamaganaProfit) || 0;\n                              bnRev += Number(r.nyabugogoRevenue) || 0; bnExp += Number(r.nyabugogoExpenses) || 0; bnProf += Number(r.nyabugogoProfit) || 0;`
  );

  content = content.replace(
    /\{ name: 'Butchery', rev: buRev, exp: buExp, prof: buProf \},/g,
    `{ name: 'Butchery Kibungo', rev: bkRev, exp: bkExp, prof: bkProf },\n                              { name: 'Butchery Rwamagana', rev: brRev, exp: brExp, prof: brProf },\n                              { name: 'Butchery Nyabugogo', rev: bnRev, exp: bnExp, prof: bnProf },`
  );

  fs.writeFileSync(file, content, 'utf8');
}

updateFinanceApiRoute();
updateAdminFinanceApiRoute();
updateFinancePage();
updateAdminPage();
console.log('Update Complete');
