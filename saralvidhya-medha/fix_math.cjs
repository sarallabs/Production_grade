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

let fixedFracCount = 0;
let fixedMissingDollarCount = 0;

allFiles.forEach(f => {
    let content = fs.readFileSync(f, 'utf8');
    let orig = content;
    
    // 1. Revert errant $\frac that should be \frac
    // This fixes things like: $$H' = $\frac{...}$$ -> $$H' = \frac{...}$$
    // And also inline things that were broken.
    // We only want to remove the $ if it is preceded by = or :
    content = content.replace(/([=:]\s*)\$\\(frac)/g, '$1\\$2');
    
    if (content !== orig) {
        fixedFracCount++;
    }
    
    // 2. Fix missing dollars on flashcard answers and rules.
    // e.g. "<b>Answer:</b> F_{\mu\nu} = \partial_\mu A_\nu - \partial_\nu A_\mu"
    // We should wrap the math part in $$...$$ if it contains math-like symbols and NO dollars exist on that line.
    
    let lines = content.split('\n');
    let modifiedLines = false;
    
    for (let i = 0; i < lines.length; i++) {
        let line = lines[i];
        
        // If the line has no dollar sign, but looks like a flashcard answer or rule with math
        if (!line.includes('$') && (line.includes('<b>Answer:</b>') || line.includes('- **Formula/Rule:**') || line.includes('**Quantitative Model:**'))) {
            // Check if it has math characters
            if (line.includes('\\') || line.includes('_') || line.includes('^')) {
                // Wrap the rest of the line in $$...$$
                // Find where the math starts (after the prefix)
                let prefix = "";
                if (line.includes('<b>Answer:</b>')) prefix = '<b>Answer:</b>';
                else if (line.includes('- **Formula/Rule:**')) prefix = '- **Formula/Rule:**';
                else if (line.includes('**Quantitative Model:**')) prefix = '**Quantitative Model:**';
                
                let parts = line.split(prefix);
                if (parts.length === 2) {
                    let mathPart = parts[1].trim();
                    if (mathPart.length > 0) {
                        lines[i] = parts[0] + prefix + ' $$' + mathPart + '$$';
                        modifiedLines = true;
                    }
                }
            }
        }
    }
    
    if (modifiedLines) {
        content = lines.join('\n');
        fixedMissingDollarCount++;
    }
    
    if (content !== orig) {
        fs.writeFileSync(f, content, 'utf8');
    }
});

console.log(`Reverted errant $\\frac in ${fixedFracCount} files`);
console.log(`Fixed missing dollars in ${fixedMissingDollarCount} files`);
