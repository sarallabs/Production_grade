const text = "<img src=\"data:image/webp;base64,abc\n\ndef\" />";
const regex = /(src=["']data:image\/[^;]+;base64,)([^"']+)(["'])/gi;
console.log(text.replace(regex, (m, p, d, s) => p + d.replace(/\s+/g, '') + s));
