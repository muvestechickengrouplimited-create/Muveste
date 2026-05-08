const fs = require('fs');

function refactorAdminOverviewApi() {
  const file = 'app/api/admin/overview/route.ts';
  let content = fs.readFileSync(file, 'utf8');

  // Replace DEPT_KEY_MAP
  content = content.replace(
    /'butchery': 'bu', 'butcher': 'bu',/,
    `'butchery kibungo': 'bk', 'butchery - kibungo': 'bk', 'butchery — kibungo': 'bk',\n  'butchery rwamagana': 'br', 'butchery - rwamagana': 'br', 'butchery — rwamagana': 'br',\n  'butchery nyabugogo': 'bn', 'butchery - nyabugogo': 'bn', 'butchery — nyabugogo': 'bn',`
  );

  // Replace getRows
  content = content.replace(
    /const \[bfRows, buRows, finExpRows, batchRows\] = await Promise\.all\(\[\n      getRows\('broiler-farm'\), getRows\('butcher'\), getRows\('finance-expenses'\), getRows\('broiler-batches'\)\n    \]\);/,
    `const [bfRows, bkRows, brRows, bnRows, finExpRows, batchRows] = await Promise.all([\n      getRows('broiler-farm'), getRows('butcher-kibungo'), getRows('butcher-rwamagana'), getRows('butcher-nyabugogo'), getRows('finance-expenses'), getRows('broiler-batches')\n    ]);`
  );

  // Replace buildDailySummary
  content = content.replace(
    /const buDay = filterByDate\(buRows \|\| \[\], dateStr, false\);\n      const dayExtras = extrasPerDate\[dateStr\] \|\| {};/g,
    `const bkDay = filterByDate(bkRows || [], dateStr, false);\n      const brDay = filterByDate(brRows || [], dateStr, false);\n      const bnDay = filterByDate(bnRows || [], dateStr, false);\n      const dayExtras = extrasPerDate[dateStr] || {};`
  );

  content = content.replace(
    /let buRev = 0, buExp = 0;\n      for \(const r of buDay\) \{ buRev \+= parseNum\(r\[7\]\); buExp \+= parseNum\(r\[6\]\); \}\n\n      \/\/ Add non-batch finance extras\n      buExp \+= \(dayExtras\.bu \|\| 0\);\n      bfTotalExp \+= \(dayExtras\.bf \|\| 0\);/g,
    `let bkRev = 0, bkExp = 0;\n      for (const r of bkDay) { bkRev += parseNum(r[7]); bkExp += parseNum(r[6]); }\n      let brRev = 0, brExp = 0;\n      for (const r of brDay) { brRev += parseNum(r[7]); brExp += parseNum(r[6]); }\n      let bnRev = 0, bnExp = 0;\n      for (const r of bnDay) { bnRev += parseNum(r[7]); bnExp += parseNum(r[6]); }\n\n      bkExp += (dayExtras.bk || 0);\n      brExp += (dayExtras.br || 0);\n      bnExp += (dayExtras.bn || 0);\n      bfTotalExp += (dayExtras.bf || 0);`
  );

  content = content.replace(
    /butcher: \{ active: !!buDay\[0\], revenue: buRev, expenses: buExp, profit: buRev - buExp, rawData: buDay\[0\] \|\| \[\], allRows: buRows\.slice\(1\)\.filter\(r => normalizeDate\(r\[0\]\) === dateStr\) \},/,
    `bk: { active: !!bkDay[0], revenue: bkRev, expenses: bkExp, profit: bkRev - bkExp, rawData: bkDay[0] || [], allRows: bkRows.slice(1).filter(r => normalizeDate(r[0]) === dateStr) },\n        br: { active: !!brDay[0], revenue: brRev, expenses: brExp, profit: brRev - brExp, rawData: brDay[0] || [], allRows: brRows.slice(1).filter(r => normalizeDate(r[0]) === dateStr) },\n        bn: { active: !!bnDay[0], revenue: bnRev, expenses: bnExp, profit: bnRev - bnExp, rawData: bnDay[0] || [], allRows: bnRows.slice(1).filter(r => normalizeDate(r[0]) === dateStr) },`
  );

  content = content.replace(
    /totals: \{ revenue: bfTotalRev \+ buRev, expenses: bfTotalExp \+ buExp \},/,
    `totals: { revenue: bfTotalRev + bkRev + brRev + bnRev, expenses: bfTotalExp + bkExp + brExp + bnExp },`
  );

  content = content.replace(
    /\[bfRows, buRows\]\.forEach\(sheet => \{/g,
    `[bfRows, bkRows, brRows, bnRows].forEach(sheet => {`
  );

  content = content.replace(
    /const activeDepts = \[summary\.broiler\.active, summary\.butcher\.active\]\.filter\(Boolean\)\.length;/g,
    `const activeDepts = [summary.broiler.active, summary.bk.active, summary.br.active, summary.bn.active].filter(Boolean).length;`
  );

  content = content.replace(
    /butcher: summary\.butcher,/g,
    `bk: summary.bk,\n        br: summary.br,\n        bn: summary.bn,`
  );

  fs.writeFileSync(file, content, 'utf8');
}

function refactorAdminOverviewPage() {
  const file = 'app/(dashboard)/admin/page.tsx';
  let content = fs.readFileSync(file, 'utf8');

  content = content.replace(
    /'butcher': \{ color: '#2D2D2D', primaryLabel: 'Meat sold', primaryKey: 'meatSold', sheetName: 'butcher' \},/g,
    `'Butchery Kibungo': { color: '#E07B00', primaryLabel: 'Meat sold', primaryKey: 'meatSold', sheetName: 'butcher-kibungo' },\n  'Butchery Rwamagana': { color: '#E07B00', primaryLabel: 'Meat sold', primaryKey: 'meatSold', sheetName: 'butcher-rwamagana' },\n  'Butchery Nyabugogo': { color: '#E07B00', primaryLabel: 'Meat sold', primaryKey: 'meatSold', sheetName: 'butcher-nyabugogo' },`
  );

  content = content.replace(
    /<span className="font-semibold text-\[#2D2D2D\]">\{dept\.name === 'butcher' \? 'Butchery' : dept\.name\}<\/span>/g,
    `<span className="font-semibold text-[#2D2D2D]">{dept.name}</span>`
  );

  content = content.replace(
    /const buData = dpts\['butcher'\]\?\.rawData \|\| \[\];\n        const buMetrics = \[\n          \{ label: 'Meat received', value: \`\$\{parseNum\(buData\[1\]\)\.toLocaleString\(\)\} kg\` \},\n          \{ label: 'Meat sold', value: \`\$\{parseNum\(buData\[2\]\)\.toLocaleString\(\)\} kg\` \},\n          \{ label: 'Damaged', value: \`\$\{parseNum\(buData\[4\]\)\.toLocaleString\(\)\} kg\` \}\n        \];\n\n        \/\/ Merge display metrics into API dept data\n        dpts\['broiler'\] = \{ \.\.\.dpts\['broiler'\], metrics: bfMetrics \};\n        dpts\['butcher'\] = \{ \.\.\.dpts\['butcher'\], metrics: buMetrics \};/g,
    `const mapButcher = (bData) => [\n          { label: 'Meat received', value: \`\$\{parseNum(bData[1]).toLocaleString()\} kg\` },\n          { label: 'Meat sold', value: \`\$\{parseNum(bData[2]).toLocaleString()\} kg\` },\n          { label: 'Damaged', value: \`\$\{parseNum(bData[4]).toLocaleString()\} kg\` }\n        ];\n\n        dpts['broiler'] = { ...dpts['broiler'], metrics: bfMetrics };\n        dpts['bk'] = { ...dpts['bk'], metrics: mapButcher(dpts['bk']?.rawData || []) };\n        dpts['br'] = { ...dpts['br'], metrics: mapButcher(dpts['br']?.rawData || []) };\n        dpts['bn'] = { ...dpts['bn'], metrics: mapButcher(dpts['bn']?.rawData || []) };`
  );

  content = content.replace(
    /'butcher': 'butcher',/g,
    `'Butchery Kibungo': 'bk',\n          'Butchery Rwamagana': 'br',\n          'Butchery Nyabugogo': 'bn',`
  );
  
  content = content.replace(
    /value=\{`\$\{activeDepts\} \/ 2`\}/g,
    `value={\`\$\{activeDepts\} / 4\`}`
  );
  
  content = content.replace(
    /activeDeptColor === 2 \? 'green' : activeDepts === 0 \? 'red' : 'yellow'/g,
    `activeDepts === 4 ? 'green' : activeDepts === 0 ? 'red' : 'yellow'`
  );
  content = content.replace(
    /const activeDeptColor = activeDepts === 2/g,
    `const activeDeptColor = activeDepts === 4`
  );

  content = content.replace(
    /\{selectedDept === 'butcher' \? 'Butchery' : selectedDept\} — full report/g,
    `{selectedDept} — full report`
  );

  // Butcher API mapping for Modal
  content = content.replace(
    /\/\/ Butcher and any other dept — use structured \?date= mode\n        const res = await fetch\(\n          `\/api\/admin\/department\?dept=\$\{encodeURIComponent\(deptName\)\}&date=\$\{today\}`,\n          \{ headers: \{ Authorization: \`Bearer \$\{token\}\` \} \}\n        \);/g,
    `// Butcher and any other dept\n        let apiDept = deptName;\n        if (deptName === 'Butchery Kibungo') apiDept = 'butcher-kibungo';\n        if (deptName === 'Butchery Rwamagana') apiDept = 'butcher-rwamagana';\n        if (deptName === 'Butchery Nyabugogo') apiDept = 'butcher-nyabugogo';\n        const res = await fetch(\n          \`/api/admin/department?dept=\$\{encodeURIComponent(apiDept)\}&date=\$\{today\}\`,\n          { headers: { Authorization: \`Bearer \$\{token\}\` } }\n        );`
  );

  fs.writeFileSync(file, content, 'utf8');
}

function refactorFinanceApi() {
  const file = 'app/api/finance/route.ts';
  let content = fs.readFileSync(file, 'utf8');

  // DEPT_KEY_MAP inside GET 1 & GET 2
  content = content.replace(
    /'butchery': 'bu', 'butcher': 'bu',/g,
    `'butchery kibungo': 'bk', 'butchery - kibungo': 'bk', 'butchery — kibungo': 'bk',\n        'butchery rwamagana': 'br', 'butchery - rwamagana': 'br', 'butchery — rwamagana': 'br',\n        'butchery nyabugogo': 'bn', 'butchery - nyabugogo': 'bn', 'butchery — nyabugogo': 'bn',`
  );
  
  content = content.replace(
    /const \[buAllRows, finExpAllRows\] = await Promise\.all\(\[\n        getRows\('butcher'\),\n        getRows\('finance-expenses'\),\n      \]\);/g,
    `const [bkAllRows, brAllRows, bnAllRows, finExpAllRows] = await Promise.all([\n        getRows('butcher-kibungo'),\n        getRows('butcher-rwamagana'),\n        getRows('butcher-nyabugogo'),\n        getRows('finance-expenses'),\n      ]);`
  );

  content = content.replace(
    /const buData = \(buAllRows \|\| \[\]\)\.slice\(1\);\n      const finExpData = \(finExpAllRows \|\| \[\]\)\.slice\(1\);/g,
    `const bkData = (bkAllRows || []).slice(1);\n      const brData = (brAllRows || []).slice(1);\n      const bnData = (bnAllRows || []).slice(1);\n      const finExpData = (finExpAllRows || []).slice(1);`
  );
  
  content = content.replace(
    /const \[buAllRows, finExpAllRows\] = await Promise\.all\(\[\n      getRows\('butcher'\),\n      getRows\('finance-expenses'\),\n    \]\);/g,
    `const [bkAllRows, brAllRows, bnAllRows, finExpAllRows] = await Promise.all([\n      getRows('butcher-kibungo'),\n      getRows('butcher-rwamagana'),\n      getRows('butcher-nyabugogo'),\n      getRows('finance-expenses'),\n    ]);`
  );

  content = content.replace(
    /const buData = \(buAllRows \|\| \[\]\)\.slice\(1\);\n    const finExpData = \(finExpAllRows \|\| \[\]\)\.slice\(1\);/g,
    `const bkData = (bkAllRows || []).slice(1);\n    const brData = (brAllRows || []).slice(1);\n    const bnData = (bnAllRows || []).slice(1);\n    const finExpData = (finExpAllRows || []).slice(1);`
  );

  content = content.replace(
    /for \(const r of buData\) \{ const d = normalizeDate\(r\[0\]\); if \(d\) allDates\.add\(d\); \}/g,
    `for (const r of bkData) { const d = normalizeDate(r[0]); if (d) allDates.add(d); }\n    for (const r of brData) { const d = normalizeDate(r[0]); if (d) allDates.add(d); }\n    for (const r of bnData) { const d = normalizeDate(r[0]); if (d) allDates.add(d); }`
  );

  content = content.replace(
    /dayExtras: Record<string, number> = \{ bu: 0, bf: 0 \}/g,
    `dayExtras: Record<string, number> = { bk: 0, br: 0, bn: 0, bf: 0 }`
  );

  content = content.replace(
    /if \(!finExtrasPerDate\[d\]\) finExtrasPerDate\[d\] = \{ bf: 0, bu: 0 \};/g,
    `if (!finExtrasPerDate[d]) finExtrasPerDate[d] = { bf: 0, bk: 0, br: 0, bn: 0 };`
  );

  content = content.replace(
    /\/\/ Butcher\n      const buDayRows = buData\.filter\(r => normalizeDate\(r\[0\]\) === normalizedDate\);\n      let buRev = 0, buExp = 0;\n      for \(const r of buDayRows\) \{ buRev \+= parseNum\(r\[7\]\); buExp \+= parseNum\(r\[6\]\); \}/g,
    `// Butcher\n      const bkDayRows = bkData.filter(r => normalizeDate(r[0]) === normalizedDate);\n      const brDayRows = brData.filter(r => normalizeDate(r[0]) === normalizedDate);\n      const bnDayRows = bnData.filter(r => normalizeDate(r[0]) === normalizedDate);\n      let bkRev = 0, bkExp = 0, brRev = 0, brExp = 0, bnRev = 0, bnExp = 0;\n      for (const r of bkDayRows) { bkRev += parseNum(r[7]); bkExp += parseNum(r[6]); }\n      for (const r of brDayRows) { brRev += parseNum(r[7]); brExp += parseNum(r[6]); }\n      for (const r of bnDayRows) { bnRev += parseNum(r[7]); bnExp += parseNum(r[6]); }\n      const buRev = bkRev + brRev + bnRev;\n      const buExp = bkExp + brExp + bnExp;`
  );

  content = content.replace(
    /tracker: Record<string, \{ value: number; submitted: boolean \}> = \{\n        'Butchery': \{ value: buExp, submitted: buDayRows\.length > 0 \},\n      \};/g,
    `tracker: Record<string, { value: number; submitted: boolean }> = {\n        'Butchery Kibungo': { value: bkExp, submitted: bkDayRows.length > 0 },\n        'Butchery Rwamagana': { value: brExp, submitted: brDayRows.length > 0 },\n        'Butchery Nyabugogo': { value: bnExp, submitted: bnDayRows.length > 0 },\n      };`
  );

  content = content.replace(
    /const totalExpenses = bfTotalExp \+ \(buExp \+ dayExtras\.bu\);/g,
    `const totalExpenses = bfTotalExp + (bkExp + dayExtras.bk) + (brExp + dayExtras.br) + (bnExp + dayExtras.bn);`
  );

  content = content.replace(
    /butcherRevenue: buRev,\n          butcherExpenses: buExp \+ dayExtras\.bu,/g,
    `butcherRevenue: buRev,\n          butcherExpenses: buExp + (dayExtras.bk + dayExtras.br + dayExtras.bn),\n          kibungoRevenue: bkRev, kibungoExpenses: bkExp + dayExtras.bk,\n          rwamaganaRevenue: brRev, rwamaganaExpenses: brExp + dayExtras.br,\n          nyabugogoRevenue: bnRev, nyabugogoExpenses: bnExp + dayExtras.bn,`
  );

  content = content.replace(
    /\/\/ Butcher\n      const buRows = buData\.filter\(r => normalizeDate\(r\[0\]\) === dateStr\);\n      let buRev = 0, buExp = 0;\n      for \(const r of buRows\) \{ buRev \+= parseNum\(r\[7\]\); buExp \+= parseNum\(r\[6\]\); \}/g,
    `// Butcher\n      const bkRows = bkData.filter(r => normalizeDate(r[0]) === dateStr);\n      const brRows = brData.filter(r => normalizeDate(r[0]) === dateStr);\n      const bnRows = bnData.filter(r => normalizeDate(r[0]) === dateStr);\n      let bkRev = 0, bkExp = 0, brRev = 0, brExp = 0, bnRev = 0, bnExp = 0;\n      for (const r of bkRows) { bkRev += parseNum(r[7]); bkExp += parseNum(r[6]); }\n      for (const r of brRows) { brRev += parseNum(r[7]); brExp += parseNum(r[6]); }\n      for (const r of bnRows) { bnRev += parseNum(r[7]); bnExp += parseNum(r[6]); }\n      const buRev = bkRev + brRev + bnRev;\n      let buExp = bkExp + brExp + bnExp;`
  );

  content = content.replace(
    /buExp \+= extras\.bu \|\| 0;/g,
    `buExp += (extras.bk || 0) + (extras.br || 0) + (extras.bn || 0);`
  );

  fs.writeFileSync(file, content, 'utf8');
}

function refactorFinancePage() {
  const file = 'app/(dashboard)/finance/page.tsx';
  let content = fs.readFileSync(file, 'utf8');

  // Change department list
  content = content.replace(
    /'Butchery',/g,
    `'Butchery Kibungo',\n    'Butchery Rwamagana',\n    'Butchery Nyabugogo',`
  );

  content = content.replace(
    /departmentColors: Record<string, string> = \{\n    'Butchery': '#2D2D2D',\n  \};/g,
    `departmentColors: Record<string, string> = {\n    'Butchery Kibungo': '#2D2D2D',\n    'Butchery Rwamagana': '#2D2D2D',\n    'Butchery Nyabugogo': '#2D2D2D',\n  };`
  );

  content = content.replace(
    /'Butchery': \{ value: 0, submitted: false \},/g,
    `'Butchery Kibungo': { value: 0, submitted: false },\n    'Butchery Rwamagana': { value: 0, submitted: false },\n    'Butchery Nyabugogo': { value: 0, submitted: false },`
  );

  content = content.replace(
    /butcherRevenue: data\.butcherRevenue\?\.toString\(\) \|\| '0',\n          butcherExpenses: data\.butcherExpenses\?\.toString\(\) \|\| '0',/g,
    `butcherRevenue: data.butcherRevenue?.toString() || '0',\n          butcherExpenses: data.butcherExpenses?.toString() || '0',`
  );
  
  content = content.replace(
    /const buR = Number\(fields\.butcherRevenue\) \|\| 0;\n    const buE = \(trackerData\['Butchery'\]\?\.value \|\| 0\) \+ \(financeExtras\['Butchery'\] \|\| 0\);/g,
    `const buR = Number(fields.butcherRevenue) || 0;\n    const buE = (trackerData['Butchery Kibungo']?.value || 0) + (financeExtras['Butchery Kibungo'] || 0) + (trackerData['Butchery Rwamagana']?.value || 0) + (financeExtras['Butchery Rwamagana'] || 0) + (trackerData['Butchery Nyabugogo']?.value || 0) + (financeExtras['Butchery Nyabugogo'] || 0);`
  );

  fs.writeFileSync(file, content, 'utf8');
}

refactorAdminOverviewApi();
refactorAdminOverviewPage();
refactorFinanceApi();
refactorFinancePage();
console.log('Refactor complete.');
