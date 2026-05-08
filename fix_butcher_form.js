const fs = require('fs');

const file = 'app/(dashboard)/finance/page.tsx';
let content = fs.readFileSync(file, 'utf8');

const regex = /\{\/\* Butchery Col \*\/\}[\s\S]*?<div className="pt-2 border-t">\s*<p className="text-xs text-gray-500 uppercase font-semibold">Profit<\/p>\s*<p className={`font-mono text-lg \$\{profitTextColor\(buProfit\)\}`}>\{buProfit\.toLocaleString\(\)\}<\/p>\s*<\/div>\s*<\/div>/m;

const replacement = `                {/* Butchery Kibungo Col */}
                <div className="space-y-4 p-4 rounded-xl border border-gray-100 bg-gray-50">
                  <h3 className="font-bold text-[#2D2D2D] border-b pb-2">Butchery Kibungo</h3>
                  <Input
                    label="Revenue" type="number" min="0"
                    value={fields.kibungoRevenue}
                    onChange={(e) => setFields({ ...fields, kibungoRevenue: e.target.value })}
                  />
                  <div className="pt-2 border-t">
                    <p className="text-xs text-gray-400 uppercase font-semibold">Expenses</p>
                    <p className="font-mono text-sm text-gray-500">{formatRWF(bkExp)}</p>
                  </div>
                  <div className="pt-2 border-t">
                    <p className="text-xs text-gray-500 uppercase font-semibold">Profit</p>
                    <p className={\`font-mono text-lg \${profitTextColor(bkProfit)}\`}>{bkProfit.toLocaleString()}</p>
                  </div>
                </div>

                {/* Butchery Rwamagana Col */}
                <div className="space-y-4 p-4 rounded-xl border border-gray-100 bg-gray-50">
                  <h3 className="font-bold text-[#2D2D2D] border-b pb-2">Butchery Rwamagana</h3>
                  <Input
                    label="Revenue" type="number" min="0"
                    value={fields.rwamaganaRevenue}
                    onChange={(e) => setFields({ ...fields, rwamaganaRevenue: e.target.value })}
                  />
                  <div className="pt-2 border-t">
                    <p className="text-xs text-gray-400 uppercase font-semibold">Expenses</p>
                    <p className="font-mono text-sm text-gray-500">{formatRWF(brExp)}</p>
                  </div>
                  <div className="pt-2 border-t">
                    <p className="text-xs text-gray-500 uppercase font-semibold">Profit</p>
                    <p className={\`font-mono text-lg \${profitTextColor(brProfit)}\`}>{brProfit.toLocaleString()}</p>
                  </div>
                </div>

                {/* Butchery Nyabugogo Col */}
                <div className="space-y-4 p-4 rounded-xl border border-gray-100 bg-gray-50">
                  <h3 className="font-bold text-[#2D2D2D] border-b pb-2">Butchery Nyabugogo</h3>
                  <Input
                    label="Revenue" type="number" min="0"
                    value={fields.nyabugogoRevenue}
                    onChange={(e) => setFields({ ...fields, nyabugogoRevenue: e.target.value })}
                  />
                  <div className="pt-2 border-t">
                    <p className="text-xs text-gray-400 uppercase font-semibold">Expenses</p>
                    <p className="font-mono text-sm text-gray-500">{formatRWF(bnExp)}</p>
                  </div>
                  <div className="pt-2 border-t">
                    <p className="text-xs text-gray-500 uppercase font-semibold">Profit</p>
                    <p className={\`font-mono text-lg \${profitTextColor(bnProfit)}\`}>{bnProfit.toLocaleString()}</p>
                  </div>
                </div>`;

content = content.replace(regex, replacement);

fs.writeFileSync(file, content, 'utf8');
console.log('Fixed butcher manual form');
