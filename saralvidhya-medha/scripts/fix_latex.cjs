const fs = require('fs');
const path = require('path');

const targetDir = path.join(__dirname, '../public/generated_resources');

let fixedCount = 0;
let fileCount = 0;

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
    
    // Look for `= \frac{` or `: \frac{` without a preceding `$`
    // Regex explanation:
    // (?<!\$)   -> Negative lookbehind: ensure there is no `$` right before
    // ([=:]\s*) -> Capture group 1: an equals sign or colon, followed by any whitespace
    // \\frac    -> Matches `\frac`
    
    const regex = /(?<!\$)([=:]\s*)\\frac/g;
    
    if (regex.test(content)) {
        // Replace with the same prefix but add a `$` before `\frac`
        const newContent = content.replace(regex, '$1$\\frac');
        fs.writeFileSync(filePath, newContent, 'utf8');
        fixedCount++;
    }
});

console.log(`Scanned ${allMdFiles.length} markdown files.`);
console.log(`Successfully fixed missing '$' symbols in ${fixedCount} files!`);
