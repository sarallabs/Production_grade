const fs = require('fs');
const path = require('path');

const dir = 'd:/saralvidhya/saralvidhya-moocs/public/generated_resources/Entomology/chapter_11/intermediate';
fs.mkdirSync(dir, { recursive: true });

// 1. summary.md (Quick Study)
const summaryContent = `# Metamorphosis - Quick Study

**Metamorphosis** is a biological process by which an animal physically develops after birth or hatching. 

## Key Points
- **Insects** commonly undergo metamorphosis.
- It involves conspicuous and relatively abrupt changes in the animal's body structure.
- **Holometabolous** insects undergo complete metamorphosis (egg, larva, pupa, adult).
- **Hemimetabolous** insects undergo incomplete metamorphosis (egg, nymph, adult).

*This is a placeholder for Quick Study.*
`;
fs.writeFileSync(path.join(dir, 'summary.md'), summaryContent, 'utf8');

// 2. detailed_view.md (Detailed Notes)
const detailedContent = `# Detailed Notes: Insect Metamorphosis

Insect metamorphosis is a fascinating evolutionary adaptation.

### Complete Metamorphosis (Holometabolous)
Insects like butterflies, beetles, and bees undergo complete metamorphosis. The larva looks entirely different from the adult. The pupal stage is a resting phase where intense cellular restructuring occurs.

### Incomplete Metamorphosis (Hemimetabolous)
Insects like grasshoppers and cockroaches undergo incomplete metamorphosis. The nymphs resemble miniature adults but lack wings. They molt several times before becoming fully mature adults.

### Hormonal Control
Metamorphosis is controlled by hormones, primarily juvenile hormone and ecdysone.

*This is a placeholder for Detailed Notes.*
`;
fs.writeFileSync(path.join(dir, 'detailed_view.md'), detailedContent, 'utf8');

// 3. mcq.md (Assessments)
const mcqContent = `## Question 1
**Question:** What is the primary purpose of metamorphosis in insects?

**Options:**
- A) To change color
- B) To allow for different life stages specializing in growth vs reproduction
- C) To escape predators
- D) To survive winter

**Correct Answer:** B

**Rationale:** Metamorphosis allows insects to separate their life cycle into a growth phase (larva) and a reproductive/dispersal phase (adult), reducing competition between the stages.

---

## Question 2
**Question:** Which of the following insects undergoes complete metamorphosis?

**Options:**
- A) Grasshopper
- B) Aphid
- C) Butterfly
- D) Cockroach

**Correct Answer:** C

**Rationale:** Butterflies undergo complete metamorphosis (holometabolous).
`;
fs.writeFileSync(path.join(dir, 'mcq.md'), mcqContent, 'utf8');

// 4. assessment.md (Some other view)
fs.writeFileSync(path.join(dir, 'assessment.md'), '# Assessment\n\n*Placeholder for Assessment Markdown*', 'utf8');

// 5. flashcards.json (Flashcards)
const flashcardsContent = `[
  {
    "front": "What is Holometabolous?",
    "back": "Complete metamorphosis (egg, larva, pupa, adult)."
  },
  {
    "front": "What is Hemimetabolous?",
    "back": "Incomplete metamorphosis (egg, nymph, adult)."
  },
  {
    "front": "Which hormone triggers molting?",
    "back": "Ecdysone"
  }
]`;
fs.writeFileSync(path.join(dir, 'flashcards.json'), flashcardsContent, 'utf8');

// 6. Also create in beginner and advanced just in case
const dirs = ['beginner', 'advanced'];
dirs.forEach(d => {
  const tDir = 'd:/saralvidhya/saralvidhya-moocs/public/generated_resources/Entomology/chapter_11/' + d;
  fs.mkdirSync(tDir, { recursive: true });
  fs.writeFileSync(path.join(tDir, 'summary.md'), summaryContent, 'utf8');
  fs.writeFileSync(path.join(tDir, 'detailed_view.md'), detailedContent, 'utf8');
  fs.writeFileSync(path.join(tDir, 'mcq.md'), mcqContent, 'utf8');
  fs.writeFileSync(path.join(tDir, 'assessment.md'), '# Assessment\n\n*Placeholder for Assessment Markdown*', 'utf8');
  fs.writeFileSync(path.join(tDir, 'flashcards.json'), flashcardsContent, 'utf8');
});

console.log('Created placeholder assets for Entomology.');
