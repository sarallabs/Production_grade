const fs = require('fs');

const md1 = `
# Flashcards

**Q:** What is this?
**A:** This is a test.
<img src="data:image/webp;base64,12345">

#
**Front:** Front of card 2
**Back:** Back of card 2
`;

const md2 = `
# Flashcards: Integrated Marketing

### Q: What is the formal definition?

### Ans: Integrated Marketing Communications...

<img src="data:image/webp;base64,67890">

### Q: Next Question?

### Ans: Next answer.
`;

const regex = /(?:\*\*(?:Q(?:\s*\(Front\))?|Front):\*\*|###\s*Q:)\s*([\s\S]*?)\s*(?:\*\*(?:A(?:\s*\(Back\))?|Back):\*\*|###\s*Ans:)\s*([\s\S]*?)(?=\n#{1,6}[ \t]+\S|\n---\s*|\n(?:\*\*(?:Q(?:\s*\(Front\))?|Front):\*\*|###\s*Q:)|$)/g;

console.log("MD1 Matches:");
for (const match of md1.matchAll(regex)) {
  console.log("Q:", match[1].trim());
  console.log("A:", match[2].trim());
}

console.log("\nMD2 Matches:");
for (const match of md2.matchAll(regex)) {
  console.log("Q:", match[1].trim());
  console.log("A:", match[2].trim());
}
