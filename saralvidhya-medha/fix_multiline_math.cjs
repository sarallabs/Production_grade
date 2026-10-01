const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(function(file) {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) { 
            results = results.concat(walk(file));
        } else if (file.endsWith('.md') || file.endsWith('.json')) {
            results.push(file);
        }
    });
    return results;
}

const allFiles = walk(path.join(__dirname, 'public/generated_resources/Nagarjuna_University/physics'));

let fixedCount = 0;

allFiles.forEach(f => {
    let content = fs.readFileSync(f, 'utf8');
    let orig = content;
    
    // Replace $$...$$ that contain newlines so that $$ are on their own lines
    // This uses a replace with a callback
    content = content.replace(/\$\$([\s\S]+?)\$\$/g, (match, inner) => {
        if (inner.includes('\n')) {
            // Trim the inner content to remove extra newlines at the start and end
            let trimmed = inner.trim();
            // Return with $$ on separate lines
            return '$$\n' + trimmed + '\n$$';
        }
        return match; // If no newline, leave it as is
    });
    
    if (content !== orig) {
        fs.writeFileSync(f, content, 'utf8');
        fixedCount++;
    }
});

console.log(`Reformatted multiline math blocks in ${fixedCount} files`);
