const path = require('path');
const fs = require('fs');

const departmentsPath = path.join(__dirname, '..', 'data', 'departments.json');

function getDepartments() {
  if (!fs.existsSync(departmentsPath)) return [];
  return JSON.parse(fs.readFileSync(departmentsPath, 'utf8'));
}

function saveDepartments(deps) {
  fs.writeFileSync(departmentsPath, JSON.stringify(deps, null, 2));
}

module.exports = { getDepartments, saveDepartments };
