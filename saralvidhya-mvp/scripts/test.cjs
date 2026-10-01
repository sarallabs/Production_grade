let m = "$sum_m \x0crac{langle s | H' | m angle langle m | H' | n angle}{E_n - E_m}$";
m = m.replace(/\$(.*?)\$/g, (match, math) => {
    math = math.replace(/[\x0c\u000c]rac/g, '\\frac');
    math = math.replace(/(?<![A-Za-z\\])(sum|int|langle|rangle|alpha|beta|gamma|delta|theta|phi|psi|omega|sigma|mu|nu|pi|lambda|partial|infty|approx|propto|equiv|times|cdot|dagger|Rightarrow|rightarrow)(?![A-Za-z])/g, '\\$1');
    math = math.replace(/(?<![A-Za-z\\])angle(?![A-Za-z])/g, '\\rangle');
    return '$' + math + '$';
});
console.log(m);
