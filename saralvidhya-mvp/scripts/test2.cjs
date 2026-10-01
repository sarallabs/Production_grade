const fs = require('fs');
let filePath = 'd:\\saralvidhya\\saralvidhya-moocs\\public\\generated_resources\\Nagarjuna_University\\physics\\chapter_04\\Examination\\certification_exam.md';
let content = fs.readFileSync(filePath, 'utf8');

let orig = content;
content = content.replace(/\$(.*?)\$/gs, (match, math) => {
    let m = math;
    m = m.replace(/[\x0c\u000c]rac/g, '\\frac');
    m = m.replace(/(?<![A-Za-z\\])(sum|int|langle|rangle|alpha|beta|gamma|delta|theta|phi|psi|omega|sigma|mu|nu|pi|lambda|partial|infty|approx|propto|equiv|times|cdot|dagger|Rightarrow|rightarrow)(?![A-Za-z])/g, '\\$1');
    m = m.replace(/(?<![A-Za-z\\])angle(?![A-Za-z])/g, '\\rangle');
    return `$${m}$`;
});

if (content !== orig) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log("Modified!");
} else {
    console.log("Not modified.");
}
