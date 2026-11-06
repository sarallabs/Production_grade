const fs = require('fs');

let content = fs.readFileSync('src/pages/StudyTable.tsx', 'utf-8');

// 1. Remove showExplanation state
content = content.replace(
  '  const [showExplanation, setShowExplanation] = useState(false);\n',
  ''
);

// 2. Remove setShowExplanation(false) calls
content = content.replace(/setShowExplanation\(false\);\n/g, '');

// 3. Remove showExplanation from handleKeyDown
content = content.replace(
  'if (isFinished || loading || showExplanation) return;',
  'if (isFinished || loading) return;'
);
content = content.replace(
  '[step, submitted, isFinished, loading, showExplanation, questions.length]',
  '[step, submitted, isFinished, loading, questions.length]'
);

// 4. Remove setShowExplanation(true) in markQuestionAnswered
content = content.replace(
  '} else {\n      setShowExplanation(true);\n    }',
  '}'
);

// 5. Remove the modal
content = content.replace(
  /\{\/\* Explanation modal for incorrect answers \*\/\}[\s\S]*?\{\s*showExplanation\s*&&\s*\([\s\S]*?\)\s*\}/g,
  ''
);
// In case the above regex missed it because it's just `{/* Explanation modal...` and `{showExplanation && (`
content = content.replace(
  /\{\s*\/\* Explanation modal for incorrect answers \*\/\s*\}\s*\{\s*showExplanation\s*&&\s*\([\s\S]*?\}\s*\}\s*>\s*Next Question ➔\s*<\/button>\s*<\/div>\s*<\/div>\s*<\/div>\s*\)\s*\}/,
  ''
);

// 6. Safeguard handleMSQSubmit
content = content.replace(
  'const correctAnswers = [...currentQ.answer].sort();',
  'const answerData = Array.isArray(currentQ.answer) ? currentQ.answer : [currentQ.answer];\n    const correctAnswers = [...answerData].sort();'
);

// 7. Safeguard MSQ render isCorrectOption
content = content.replace(
  'const isCorrectOption = currentQ.answer.includes(idx);',
  'const answerData = Array.isArray(currentQ.answer) ? currentQ.answer : [currentQ.answer];\n                      const isCorrectOption = answerData.includes(idx);'
);

// 8. Move MSQ Submit button out of .quiz-options or just make it big and bold
content = content.replace(
  'opacity: selectedMSQ.length === 0 ? 0.5 : 1,',
  'width: "100%", padding: "12px 24px", fontSize: "1rem",'
);

// 9. Add "Next Question" button to the inline feedback
content = content.replace(
  '                      {currentQ.explanation}\n                    </div>\n                  </div>\n                )}',
  '                      {currentQ.explanation}\n                    </div>\n                    <div style={{ marginTop: "16px", display: "flex", justifyContent: "flex-end" }}>\n                      <button className="quiz-btn-primary" onClick={handleNext} style={{ padding: "8px 16px", fontSize: "0.9rem" }}>{step === questions.length - 1 ? "Finish Assessment ➔" : "Next Question ➔"}</button>\n                    </div>\n                  </div>\n                )}'
);

fs.writeFileSync('src/pages/StudyTable.tsx', content, 'utf-8');
