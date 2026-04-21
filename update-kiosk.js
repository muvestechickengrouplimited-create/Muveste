import fs from 'fs';
import path from 'path';

const projectDir = 'c:/Users/user/30-plus';

// 1. EggKioskForm.tsx
const formPath = path.join(projectDir, 'components/forms/EggKioskForm.tsx');
let formSrc = fs.readFileSync(formPath, 'utf8');

// Replace standard terms
formSrc = formSrc.replace(/eggsReceived/g, 'traysReceived');
formSrc = formSrc.replace(/eggsSold/g, 'traysSold');
formSrc = formSrc.replace(/pricePerEgg/g, 'pricePerTray');
formSrc = formSrc.replace(/damagedEggs/g, 'damagedTrays');
formSrc = formSrc.replace(/Eggs Received/g, 'Trays Received');
formSrc = formSrc.replace(/Eggs Sold/g, 'Trays Sold');
formSrc = formSrc.replace(/Price\/Egg/g, 'Price/Tray');
formSrc = formSrc.replace(/Damaged Eggs/g, 'Damaged Trays');

// Add traysLeft
formSrc = formSrc.replace(/const totalSales, setTotalSales.*?\n\s+const \[profit, setProfit.*?\n/s, `const [totalSales, setTotalSales] = useState(0);\n  const [profit, setProfit]         = useState(0);\n  const [traysLeft, setTraysLeft]   = useState(0);\n`);

formSrc = formSrc.replace(/const sales       = traysSoldNum \* priceNum;\n\s+const damagedLoss = damagedNum \* priceNum;\n\s+setTotalSales\(sales\);\n\s+setProfit\(sales - expensesNum - damagedLoss\);\n\s+\}, \[traysSoldNum, priceNum, damagedNum, expensesNum\]\);/s, `const sales       = traysSoldNum * priceNum;\n    const damagedLoss = damagedNum * priceNum;\n    const left        = traysReceivedNum - traysSoldNum - damagedNum;\n    setTotalSales(sales);\n    setTraysLeft(left);\n    setProfit(sales - expensesNum - damagedLoss);\n  }, [traysReceivedNum, traysSoldNum, priceNum, damagedNum, expensesNum]);`);

formSrc = formSrc.replace(/const traysSoldNum   = Number\(fields\.traysSold\)   \|\| 0;/, `const traysReceivedNum = Number(fields.traysReceived) || 0;\n  const traysSoldNum   = Number(fields.traysSold)   || 0;`);

formSrc = formSrc.replace(/Auto: Trays Sold × Price\/Tray/g, 'Auto: Trays Sold × Price/Tray');
formSrc = formSrc.replace(/Auto: Total Sales - Expenses - \(Damaged × Price\/Tray\)/g, 'Auto: Total Sales - Expenses - (Damaged Loss)');

// Display boxes
const displayBoxesRegex = /\{\/\* ── Auto-calculated boxes ──────────────────────────────────── \*\/\}[\s\S]*?(?=\{\/\* ── Notes ─────────────────────────────────────────────────── \*\/)/;

const newDisplayBoxes = `{/* ── Auto-calculated boxes ──────────────────────────────────── */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-t pt-6 border-b pb-6 border-gray-100">

            {/* Trays Left */}
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
              <p className="text-xs text-gray-400">Trays Left</p>
              <p className={\`text-xl font-bold font-mono
                \${traysLeft < 0 
                  ? 'text-[#D9534F]' 
                  : traysLeft < 10 
                    ? 'text-[#E07B00]' 
                    : 'text-[#1B6B3A]'}\`}>
                {traysLeft}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {traysLeft < 0 ? 'Check your numbers!' : 
                 traysLeft < 10 ? 'Running low!' : 'In stock'}
              </p>
            </div>

            {/* Total Sales */}
            <div className="bg-[#FFF8E1] border-2 border-[#F5C518] rounded-xl p-4">
              <label className="text-sm font-semibold text-[#E07B00]">Total Sales (RWF)</label>
              <p className="text-2xl font-bold text-[#2D2D2D] font-mono mt-1">
                {totalSales.toLocaleString()}
              </p>
            </div>

            {/* Profit */}
            <div className={\`border-2 rounded-xl p-4 \${profit >= 0 ? 'bg-[#EAF5EE] border-[#1B6B3A]' : 'bg-red-50 border-[#D9534F]'}\`}>
              <label className="text-sm font-semibold text-gray-700">Profit (RWF)</label>
              <p className={\`text-2xl font-bold font-mono mt-1 \${profit >= 0 ? 'text-[#1B6B3A]' : 'text-[#D9534F]'}\`}>
                {profit.toLocaleString()}
              </p>
            </div>
          </div>\n\n          `;
formSrc = formSrc.replace(displayBoxesRegex, newDisplayBoxes);

fs.writeFileSync(formPath, formSrc, 'utf8');

// 2. route.ts API
const apiPath = path.join(projectDir, 'app/api/egg-kiosk/route.ts');
let apiSrc = fs.readFileSync(apiPath, 'utf8');
apiSrc = apiSrc.replace(/eggsReceived/g, 'traysReceived');
apiSrc = apiSrc.replace(/eggsSold/g, 'traysSold');
apiSrc = apiSrc.replace(/pricePerEgg/g, 'pricePerTray');
apiSrc = apiSrc.replace(/damagedEggs/g, 'damagedTrays');
apiSrc = apiSrc.replace(/Eggs Received/g, 'Trays Received');
apiSrc = apiSrc.replace(/Eggs Sold/g, 'Trays Sold');
apiSrc = apiSrc.replace(/Price\/Egg/g, 'Price/Tray');
apiSrc = apiSrc.replace(/Damaged Eggs/g, 'Damaged Trays');
// row data logic
const rowDataRegex = /const rowData = \[.*?\];/s;
const newRowData = `const traysLeft = parseNum(traysReceived) - parseNum(traysSold) - parseNum(damagedTrays);\n    const rowData = [\n      date,\n      location,\n      parseNum(traysReceived),\n      parseNum(traysSold),\n      parseNum(pricePerTray),\n      parseNum(damagedTrays),\n      parseNum(expenses),\n      totalSales,\n      traysLeft,\n      profit,\n      notes || '',\n      userEmail,\n      now.toISOString(),\n    ];`;
apiSrc = apiSrc.replace(rowDataRegex, newRowData);
// GET parsing
apiSrc = apiSrc.replace(/totalEggsSold/g, 'totalTraysSold');
apiSrc = apiSrc.replace(/totalSales\s*\+=\s*parseNum\((row\[7\])\);/g, 'totalSales += parseNum(row[7]);');
apiSrc = apiSrc.replace(/traysSold:\s*parseNum\((row\[3\])\),/g, 'traysSold: parseNum(row[3]),');
apiSrc = apiSrc.replace(/const recent = dataRows\s*\.filter\(\(row\) => {[\s\S]*?timestamp:\s*row\[11\] \?\? '',\n\s*}}\)/, `const recent = dataRows
      .filter((row) => {
        const rowDate = new Date(row[0]);
        return !isNaN(rowDate.getTime()) && rowDate >= cutoff30;
      })
      .map((row) => ({
        date:         row[0]  ?? '',
        location:     row[1]  ?? '',
        traysReceived: parseNum(row[2]),
        traysSold:     parseNum(row[3]),
        pricePerTray:  parseNum(row[4]),
        damagedTrays:  parseNum(row[5]),
        expenses:     parseNum(row[6]),
        totalSales:   parseNum(row[7]),
        traysLeft:    parseNum(row[8]),
        profit:       parseNum(row[9]),
        notes:        row[10] ?? '',
        submittedBy:  row[11] ?? '',
        timestamp:    row[12] ?? '',
      }))`);
fs.writeFileSync(apiPath, apiSrc, 'utf8');

// 3. Admin Overview Modal
const adminPath = path.join(projectDir, 'app/(dashboard)/admin/page.tsx');
let adminSrc = fs.readFileSync(adminPath, 'utf8');
const adminModalRepl = `setDeptDetails({
              department: deptName, date: today,
              fields: [
                { label: 'Location',       value: match[1] },
                { label: 'Trays Received', value: Number(match[2] || 0).toLocaleString() },
                { label: 'Trays Sold',     value: Number(match[3] || 0).toLocaleString() },
                { label: 'Price/Tray',     value: \`RWF \${Number(match[4] || 0).toLocaleString()}\` },
                { label: 'Damaged Trays',  value: Number(match[5] || 0).toLocaleString() },
                { label: 'Trays Left',     value: Number(match[8] || 0).toLocaleString() },
              ],
              medications: null,
              revenue: Number(match[7] || 0), expenses: Number(match[6] || 0), profit: Number(match[9] || 0),
              notes: match[10] || null
            });`;
adminSrc = adminSrc.replace(/setDeptDetails\(\{[\s\S]*?notes: match\[9\] \|\| null\n\s*\}\);/, adminModalRepl);
// And also change egg sold refs to tray in the stat cards for KIosk
adminSrc = adminSrc.replace(/'Eggs sold'/g, "'Trays sold'");
adminSrc = adminSrc.replace(/eggsSold:/g, 'traysSold:');
adminSrc = adminSrc.replace(/primaryKey: 'eggsSold'/g, "primaryKey: 'traysSold'");
adminSrc = adminSrc.replace(/Eggs laid/g, "Trays laid");
fs.writeFileSync(adminPath, adminSrc, 'utf8');

console.log('Update script completed successfully.');
