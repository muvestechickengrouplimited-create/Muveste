import fs from 'fs';
import path from 'path';

const file = 'c:/Users/user/30-plus/app/(dashboard)/egg-kiosk/page.tsx';
let src = fs.readFileSync(file, 'utf8');

src = src.replace(/eggsReceived/g, 'traysReceived');
src = src.replace(/eggsSold/g, 'traysSold');
src = src.replace(/pricePerEgg/g, 'pricePerTray');
src = src.replace(/damagedEggs/g, 'damagedTrays');
src = src.replace(/Eggs Sold/g, 'Trays Sold');
src = src.replace(/Price\/Egg/g, 'Price/Tray');
src = src.replace(/Damaged Eggs/g, 'Damaged Trays');
src = src.replace(/Eggs Sold Today/ig, 'Trays Sold Today');

// Add traysLeft
src = src.replace(/damagedTrays:  number;\n  expenses:     number;\n  totalSales:   number;\n  profit:       number;/, "damagedTrays:  number;\n  expenses:     number;\n  totalSales:   number;\n  traysLeft:    number;\n  profit:       number;");

const deriveTodayRegex = /\/\/ ── Derive today's totals ───────────────────────────────────────────────\n  const todayRecords  = records\.filter\(\(r\) => r\.date === todayStr\);\n  const todayTraysSold = todayRecords\.reduce\(\(s, r\) => s \+ r\.traysSold,   0\);\n  const todaySales    = todayRecords\.reduce\(\(s, r\) => s \+ r\.totalSales,  0\);\n  const todayProfit   = todayRecords\.reduce\(\(s, r\) => s \+ r\.profit,      0\);\n  const todayDamaged  = todayRecords\.reduce\(\(s, r\) => s \+ r\.damagedTrays, 0\);/s;

const deriveReplace = `// ── Derive today's totals ───────────────────────────────────────────────
  const todayRecords  = records.filter((r) => r.date === todayStr);
  const todayTraysSold = todayRecords.reduce((s, r) => s + r.traysSold,   0);
  const todaySales    = todayRecords.reduce((s, r) => s + r.totalSales,  0);
  const todayProfit   = todayRecords.reduce((s, r) => s + r.profit,      0);
  const todayDamaged  = todayRecords.reduce((s, r) => s + r.damagedTrays, 0);
  const todayTraysLeft = todayRecords.reduce((s, r) => s + r.traysLeft, 0);`;

src = src.replace(deriveTodayRegex, deriveReplace);

const statCardsRegex = /<StatCard\n\s*title="Trays Sold Today"\n\s*value=\{todayTraysSold\.toLocaleString\(\)\}\n\s*icon=\{<EggSoldIcon \/>\}\n\s*className="border-l-4 border-\[#1B6B3A\]"\n\s*\/>\n\s*<StatCard\n\s*title="Total Sales"[\s\S]*?className="border-l-4 border-\[#E07B00\]"\n\s*\/>/s;

const statCardsReplace = `<StatCard title="Trays sold today" value={todayTraysSold.toLocaleString()} color="green" />
        <StatCard title="Trays left" value={todayTraysLeft.toLocaleString()} color={todayTraysLeft < 10 ? "orange" : "green"} />
        <StatCard title="Total sales" value={formatRWF(todaySales)} color="yellow" />
        <StatCard title="Profit today" value={formatRWF(todayProfit)} color={todayProfit >= 0 ? "green" : "red"} />`;

src = src.replace(statCardsRegex, statCardsReplace);

const tableHeadRegex = /<TableHead>Date<\/TableHead>\n\s*<TableHead>Trays Sold<\/TableHead>\n\s*<TableHead>Price\/Tray<\/TableHead>\n\s*<TableHead>Total Sales<\/TableHead>\n\s*<TableHead>Expenses<\/TableHead>\n\s*<TableHead>Profit<\/TableHead>/;

const tableHeadReplace = `<TableHead>Date</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Trays Sold</TableHead>
                  <TableHead>Trays Left</TableHead>
                  <TableHead>Total Sales</TableHead>
                  <TableHead>Profit</TableHead>`;
src = src.replace(tableHeadRegex, tableHeadReplace);

const tableBodyRegex = /<TableCell className="font-mono">\n\s*\{record\.traysSold\.toLocaleString\(\)\}\n\s*<\/TableCell>\n\s*<TableCell className="font-mono text-gray-600">\n\s*\{record\.pricePerTray\.toLocaleString\(\)\}\n\s*<\/TableCell>\n\s*<TableCell className="font-mono text-\[#E07B00\] font-semibold">\n\s*\{formatRWF\(record\.totalSales\)\}\n\s*<\/TableCell>\n\s*<TableCell className="font-mono text-gray-500">\n\s*\{formatRWF\(record\.expenses\)\}\n\s*<\/TableCell>/s;

const tableBodyReplace = `<TableCell>{record.location}</TableCell>
                    <TableCell className="font-mono">{record.traysSold.toLocaleString()}</TableCell>
                    <TableCell className="font-mono">{record.traysLeft.toLocaleString()}</TableCell>
                    <TableCell className="font-mono text-[#E07B00] font-semibold">{formatRWF(record.totalSales)}</TableCell>`;

src = src.replace(tableBodyRegex, tableBodyReplace);

fs.writeFileSync(file, src, 'utf8');

console.log('Done script 2');
