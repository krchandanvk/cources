const fs = require('fs');
const path = require('path');

const manifestPath = 'c:\\Users\\DELL\\Documents\\GitHub\\cources\\courses\\manifest.json';
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

manifest.courses.forEach(c => {
  if (c.course_id <= 6) {
    c.status = 'completed';
    c.last_updated = new Date().toISOString();
  }
});

fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
console.log('manifest.json updated successfully. Courses 1-6 marked as completed.');
