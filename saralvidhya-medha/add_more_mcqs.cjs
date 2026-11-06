const fs = require('fs');
const path = require('path');

const dirs = ['beginner', 'intermediate', 'advanced'];

const moreMcqs = `
## Question 3
**Question:** What is the larval stage of a butterfly commonly called?

**Options:**
- A) Maggot
- B) Grub
- C) Caterpillar
- D) Nymph

**Correct Answer:** C

**Rationale:** The caterpillar is the larval stage of butterflies and moths (Lepidoptera), specialized for feeding and rapid growth.

---

## Question 4
**Question:** Which of these is a characteristic of hemimetabolous (incomplete metamorphosis) insects?

**Options:**
- A) They have a pupal stage
- B) The nymphs generally resemble small adults
- C) Their wings develop internally
- D) The larva looks completely different from the adult

**Correct Answer:** B

**Rationale:** In hemimetabolous insects, the immature stages (nymphs) look similar to the adults but are smaller and lack fully developed wings and reproductive organs.

---

## Question 5
**Question:** What triggers the molting process in insects?

**Options:**
- A) Temperature changes
- B) Ecdysone hormone
- C) Juvenile hormone
- D) Lack of food

**Correct Answer:** B

**Rationale:** Ecdysone is the steroid hormone that controls molting (ecdysis) in insects, while juvenile hormone determines the nature of the molt (e.g., larva to larva vs larva to pupa).

---
`;

dirs.forEach(d => {
  const filePath = 'd:/saralvidhya/saralvidhya-moocs/public/generated_resources/Entomology/chapter_11/' + d + '/mcq.md';
  let content = fs.readFileSync(filePath, 'utf8');
  content += moreMcqs;
  fs.writeFileSync(filePath, content, 'utf8');
});

console.log('Added more MCQs.');
