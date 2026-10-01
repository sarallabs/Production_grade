const fs = require('fs');
const path = require('path');

const targetDir = path.join(__dirname, '../public/generated_resources');

let fixedCount = 0;

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(function(file) {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) { 
            results = results.concat(walk(file));
        } else if (file.endsWith('.md')) {
            results.push(file);
        }
    });
    return results;
}

const allMdFiles = walk(targetDir);

allMdFiles.forEach(filePath => {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Regex to find cases where my previous script incorrectly added a `$` 
    // inside an ALREADY OPENED math block.
    // Example: `$RMS = $\frac` -> should be `$RMS = \frac`
    // We only match if the variable name contains typical math identifier characters.
    const regex = /\$\s*([A-Za-z0-9_{}\\]+)\s*=\s*\$\s*\\frac/g;
    
    if (regex.test(content)) {
        const newContent = content.replace(regex, '$$$1 = \\frac');
        fs.writeFileSync(filePath, newContent, 'utf8');
        fixedCount++;
    }
});

console.log(`Successfully reverted double-dollar injection in ${fixedCount} files!`);
