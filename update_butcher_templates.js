const fs = require('fs');
const path = require('path');

const departments = [
  {
    id: 'kibungo',
    name: 'Kibungo',
    email: 'butchery-kibungo@muveste.com'
  },
  {
    id: 'rwamagana',
    name: 'Rwamagana',
    email: 'butchery-rwamagana@muveste.com'
  },
  {
    id: 'nyabugogo',
    name: 'Nyabugogo',
    email: 'butchery-nyabugogo@muveste.com'
  }
];

departments.forEach(dept => {
  const capId = dept.id.charAt(0).toUpperCase() + dept.id.slice(1);
  const formName = `Butcher${capId}Form`;
  const mobileName = `Butcher${capId}Mobile`;
  const dashboardName = `Butcher${capId}Dashboard`;
  
  // 1. Update Page
  const pagePath = path.join(__dirname, 'app', '(dashboard)', `butcher-${dept.id}`, 'page.tsx');
  let pageStr = fs.readFileSync(pagePath, 'utf8');
  pageStr = pageStr.replace(/ButcherForm/g, formName);
  pageStr = pageStr.replace(/Butchery — Daily Report/g, `Butchery — ${dept.name}`);
  pageStr = pageStr.replace(/butcherDashboard/g, dashboardName);
  pageStr = pageStr.replace(/\/api\/butcher/g, `/api/butcher-${dept.id}`);
  pageStr = pageStr.replace(/ButcherMobile/g, mobileName);
  fs.writeFileSync(pagePath, pageStr, 'utf8');

  // 2. Update Form
  const formPath = path.join(__dirname, 'components', 'forms', `${formName}.tsx`);
  let formStr = fs.readFileSync(formPath, 'utf8');
  formStr = formStr.replace(/ButcherForm/g, formName);
  formStr = formStr.replace(/Butchery Form/g, `Butchery — ${dept.name} Form`);
  formStr = formStr.replace(/\/api\/butcher/g, `/api/butcher-${dept.id}`);
  fs.writeFileSync(formPath, formStr, 'utf8');

  // 3. Update API
  const apiPath = path.join(__dirname, 'app', 'api', `butcher-${dept.id}`, 'route.ts');
  let apiStr = fs.readFileSync(apiPath, 'utf8');
  apiStr = apiStr.replace(/'butchery@muveste\.com'/g, `'${dept.email}'`);
  apiStr = apiStr.replace(/'butcher'/g, `'butcher-${dept.id}'`);
  fs.writeFileSync(apiPath, apiStr, 'utf8');
});

console.log('Update complete.');
