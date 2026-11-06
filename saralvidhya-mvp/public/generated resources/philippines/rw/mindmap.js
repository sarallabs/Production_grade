/**
 * Topic: Critical Reading as Looking for Ways of Thinking
 * Subject: Reading and Writing Skills
 * Institution: De La Salle University - Senior High School Department (2nd Trimester, A.Y. 2024-2025)
 *
 * Interactive Mindmap Engine and Hierarchical Data Model
 * Auto-mounts into #mindmap / #mindmap-container / document.body
 */

(function (global) {
  'use strict';

  var mindmapData = {
  "id": "root",
  "label": "Critical Reading as Ways of Thinking",
  "level": 0,
  "children": [
    {
      "id": "b1",
      "label": "1. Taxonomy of Reading & Foundations",
      "level": 1,
      "children": [
        {
          "id": "b1_1",
          "label": "Four Kinds of Reading (Hirschberg)",
          "level": 2,
          "children": [
            {
              "id": "b1_1_1",
              "label": "Casual Reading (Involuntary / Signs / Headlines)",
              "level": 3
            },
            {
              "id": "b1_1_2",
              "label": "Reading for Pleasure (Fiction / Bedtime Transport)",
              "level": 3
            },
            {
              "id": "b1_1_3",
              "label": "Reading for Information (School & Work Tool)",
              "level": 3
            },
            {
              "id": "b1_1_4",
              "label": "Critical Reading (Active Mental Dialogue & Non-Gullibility)",
              "level": 3
            }
          ]
        },
        {
          "id": "b1_2",
          "label": "Origins of the Essay (Montaigne)",
          "level": 2,
          "children": [
            {
              "id": "b1_2_1",
              "label": "Michel Montaigne (1580) - 'Essais' (Attempts)",
              "level": 3
            },
            {
              "id": "b1_2_2",
              "label": "Personal Mind Exploring Attitudes vs Dogma",
              "level": 3
            },
            {
              "id": "b1_2_3",
              "label": "Direct Unmediated Voice of the Writer",
              "level": 3
            }
          ]
        },
        {
          "id": "b1_3",
          "label": "Democratic Inquiry vs Conformism",
          "level": 2,
          "children": [
            {
              "id": "b1_3_1",
              "label": "Demystifying Authority (Kicking Author Off Throne)",
              "level": 3
            },
            {
              "id": "b1_3_2",
              "label": "Critical Reading as Civic Agency & Independent Thinking",
              "level": 3
            }
          ]
        }
      ]
    },
    {
      "id": "b2",
      "label": "2. The Cognitive Triad",
      "level": 1,
      "children": [
        {
          "id": "b2_1",
          "label": "Analysis (Deconstruction)",
          "level": 2,
          "children": [
            {
              "id": "b2_1_1",
              "label": "Dissecting Idea Composition & Connections",
              "level": 3
            },
            {
              "id": "b2_1_2",
              "label": "Unearthing Biases, Prejudices & Assumptions",
              "level": 3
            },
            {
              "id": "b2_1_3",
              "label": "Gathering Diverse Multi-Source Evidence",
              "level": 3
            }
          ]
        },
        {
          "id": "b2_2",
          "label": "Synthesis (Creative Blending)",
          "level": 2,
          "children": [
            {
              "id": "b2_2_1",
              "label": "Absorbing & Blending Multiple Viewpoints",
              "level": 3
            },
            {
              "id": "b2_2_2",
              "label": "Tempering Arrogance (Multiple Truths Exist)",
              "level": 3
            },
            {
              "id": "b2_2_3",
              "label": "Forging an Original, Authentic Voice",
              "level": 3
            }
          ]
        },
        {
          "id": "b2_3",
          "label": "Evaluation (Judicious Appraisal)",
          "level": 2,
          "children": [
            {
              "id": "b2_3_1",
              "label": "Assessing & Grading Logic and Evidence",
              "level": 3
            },
            {
              "id": "b2_3_2",
              "label": "Placing Weight on the Seesaw (Taking Reasoned Sides)",
              "level": 3
            },
            {
              "id": "b2_3_3",
              "label": "The Middle Road Principle (Avoiding Extremes)",
              "level": 3
            }
          ]
        }
      ]
    },
    {
      "id": "b3",
      "label": "3. The 14 Guidelines for Critical Reading",
      "level": 1,
      "children": [
        {
          "id": "b3_1",
          "label": "Guidelines 1-3: Active Demystification",
          "level": 2,
          "children": [
            {
              "id": "b3_1_1",
              "label": "1. Read Actively (Dialogue & Note Errors)",
              "level": 3
            },
            {
              "id": "b3_1_2",
              "label": "2. Demystify the Writer (Fallible Humans)",
              "level": 3
            },
            {
              "id": "b3_1_3",
              "label": "3. Comprehend Before Judging (Reread & Define)",
              "level": 3
            }
          ]
        },
        {
          "id": "b3_2",
          "label": "Guidelines 4-6: Objectivity & Inversion",
          "level": 2,
          "children": [
            {
              "id": "b3_2_1",
              "label": "4. Invert Arguments (Imagine Counter-Positions)",
              "level": 3
            },
            {
              "id": "b3_2_2",
              "label": "5. Uncover Biases & Demographic Assumptions",
              "level": 3
            },
            {
              "id": "b3_2_3",
              "label": "6. Separate Emotion from Fact (Reject Slogans)",
              "level": 3
            }
          ]
        },
        {
          "id": "b3_3",
          "label": "Guidelines 7-9: Research & Evidence",
          "level": 2,
          "children": [
            {
              "id": "b3_3_1",
              "label": "7. Research Unknowns (Consult Affected Parties)",
              "level": 3
            },
            {
              "id": "b3_3_2",
              "label": "8. Cross-Disciplinary Insights (History vs Psych)",
              "level": 3
            },
            {
              "id": "b3_3_3",
              "label": "9. Scrutinize Evidence (Date, Recency, Common Sense)",
              "level": 3
            }
          ]
        },
        {
          "id": "b3_4",
          "label": "Guidelines 10-14: Logic, Annotation & Context",
          "level": 2,
          "children": [
            {
              "id": "b3_4_1",
              "label": "10. Ponder Implicit Philosophical Values",
              "level": 3
            },
            {
              "id": "b3_4_2",
              "label": "11. Recognize Logical Fallacies (Ad Hominem, Non Sequitur)",
              "level": 3
            },
            {
              "id": "b3_4_3",
              "label": "12. Reject Bogus Claims & Unverified Stats",
              "level": 3
            },
            {
              "id": "b3_4_4",
              "label": "13. Marginal Annotation (Chatting With Author)",
              "level": 3
            },
            {
              "id": "b3_4_5",
              "label": "14. Contextualize Opening Debate (Rooney & Fowler)",
              "level": 3
            }
          ]
        }
      ]
    },
    {
      "id": "b4",
      "label": "4. Essay Architecture & Logic Signposts",
      "level": 1,
      "children": [
        {
          "id": "b4_1",
          "label": "Thesis Discovery (Behrens & Rosen)",
          "level": 2,
          "children": [
            {
              "id": "b4_1_1",
              "label": "Single Declarative Focused Sentence",
              "level": 3
            },
            {
              "id": "b4_1_2",
              "label": "Twain's 'Lowest Animal' Case Study",
              "level": 3
            },
            {
              "id": "b4_1_3",
              "label": "Guiding Reader Anticipation",
              "level": 3
            }
          ]
        },
        {
          "id": "b4_2",
          "label": "Signpost Connectives",
          "level": 2,
          "children": [
            {
              "id": "b4_2_1",
              "label": "Premise Signals (since, because, follows from, inasmuch as)",
              "level": 3
            },
            {
              "id": "b4_2_2",
              "label": "Conclusion Signals (therefore, hence, thus, it follows that)",
              "level": 3
            }
          ]
        },
        {
          "id": "b4_3",
          "label": "Narrative Opening Devices",
          "level": 2,
          "children": [
            {
              "id": "b4_3_1",
              "label": "Anecdote Hooks (Jill Nelson's 'Number One!')",
              "level": 3
            },
            {
              "id": "b4_3_2",
              "label": "Provocative Quotations & Posed Questions",
              "level": 3
            }
          ]
        }
      ]
    },
    {
      "id": "b5",
      "label": "5. Intertextuality & Cultural Narratives",
      "level": 1,
      "children": [
        {
          "id": "b5_1",
          "label": "Definition & Dynamics (Dharwadker et al.)",
          "level": 2,
          "children": [
            {
              "id": "b5_1_1",
              "label": "Application of Text Within Another Text",
              "level": 3
            },
            {
              "id": "b5_1_2",
              "label": "Borrowing Invites Cognitive Comparison",
              "level": 3
            }
          ]
        },
        {
          "id": "b5_2",
          "label": "Two Forms of Intertextuality",
          "level": 2,
          "children": [
            {
              "id": "b5_2_1",
              "label": "Form 1: Book in a Book (Literary in Literary)",
              "level": 3
            },
            {
              "id": "b5_2_2",
              "label": "Form 2: Other Text in a Book (Media/Social in Literature)",
              "level": 3
            }
          ]
        },
        {
          "id": "b5_3",
          "label": "Three Functions of Intertextuality",
          "level": 2,
          "children": [
            {
              "id": "b5_3_1",
              "label": "Function 1: Comparison & Contrast",
              "level": 3
            },
            {
              "id": "b5_3_2",
              "label": "Function 2: Dialogic Conversation",
              "level": 3
            },
            {
              "id": "b5_3_3",
              "label": "Function 3: Destabilization & Subversion",
              "level": 3
            }
          ]
        },
        {
          "id": "b5_4",
          "label": "Three Transformative Effects",
          "level": 2,
          "children": [
            {
              "id": "b5_4_1",
              "label": "Effect 1: Transformation of Primary Book",
              "level": 3
            },
            {
              "id": "b5_4_2",
              "label": "Effect 2: Transformation of Prior Text (Reflexive)",
              "level": 3
            },
            {
              "id": "b5_4_3",
              "label": "Effect 3: Simultaneous Reinterpretation",
              "level": 3
            }
          ]
        }
      ]
    },
    {
      "id": "b6",
      "label": "6. Hypertext vs. Intertextuality",
      "level": 1,
      "children": [
        {
          "id": "b6_1",
          "label": "Hypertext (Technological Non-Linearity)",
          "level": 2,
          "children": [
            {
              "id": "b6_1_1",
              "label": "Digital Electronic Links & Nodes",
              "level": 3
            },
            {
              "id": "b6_1_2",
              "label": "Reader Navigates Clickable Trajectories",
              "level": 3
            }
          ]
        },
        {
          "id": "b6_2",
          "label": "Intertextuality (Cognitive Multi-Vocality)",
          "level": 2,
          "children": [
            {
              "id": "b6_2_1",
              "label": "Hermeneutic & Narrative Dialogue",
              "level": 3
            },
            {
              "id": "b6_2_2",
              "label": "Memory, Allusion & Cultural Resonance",
              "level": 3
            }
          ]
        }
      ]
    },
    {
      "id": "b7",
      "label": "7. Critical Reading for Critique (Behrens & Rosen Ch. 2)",
      "level": 1,
      "children": [
        {
          "id": "b7_1",
          "label": "The Two Guiding Questions",
          "level": 2,
          "children": [
            {
              "id": "b7_1_1",
              "label": "Question 1: Success in Purpose (Inform / Persuade / Entertain)",
              "level": 3
            },
            {
              "id": "b7_1_2",
              "label": "Question 2: Personal Agreement (Evaluating Warrants & Claims)",
              "level": 3
            }
          ]
        },
        {
          "id": "b7_2",
          "label": "Evaluating Informative vs Persuasive Writing",
          "level": 2,
          "children": [
            {
              "id": "b7_2_1",
              "label": "Informative Metrics: Accuracy, Significance ('So What?'), Fair Interpretation",
              "level": 3
            },
            {
              "id": "b7_2_2",
              "label": "Persuasive Metrics: Testing Evidence, Reasoning, Counter-Arguments",
              "level": 3
            }
          ]
        },
        {
          "id": "b7_3",
          "label": "Auditing Assumptions & Warrants",
          "level": 2,
          "children": [
            {
              "id": "b7_3_1",
              "label": "Explicit vs Hidden Assumptions (Foundations of Arguments)",
              "level": 3
            },
            {
              "id": "b7_3_2",
              "label": "Finance Case Study: The 2008 Subprime Mortgage Collapse",
              "level": 3
            }
          ]
        },
        {
          "id": "b7_4",
          "label": "Charles Krauthammer Case Study (2009)",
          "level": 2,
          "children": [
            {
              "id": "b7_4_1",
              "label": "'The Moon We Left Behind' Rhetorical Analysis",
              "level": 3
            },
            {
              "id": "b7_4_2",
              "label": "Emotionally Loaded Diction ('Abandonment', 'Retreat')",
              "level": 3
            },
            {
              "id": "b7_4_3",
              "label": "Auditing Conservative Ideology vs $1T Federal Spending",
              "level": 3
            }
          ]
        }
      ]
    }
  ]
};

  function renderTree(node, container) {
    var el = document.createElement('div');
    el.className = 'node-item level-' + node.level;
    el.style.marginLeft = (node.level * 20) + 'px';
    el.style.marginBottom = '6px';
    el.style.padding = '8px 12px';
    el.style.borderRadius = '6px';
    el.style.background = node.level === 0 ? '#1b4332' : node.level === 1 ? '#2d6a4f' : node.level === 2 ? '#40916c' : '#74c69d';
    el.style.color = node.level > 2 ? '#081c15' : '#ffffff';
    el.style.fontWeight = node.level < 2 ? '700' : '500';
    el.style.fontSize = node.level === 0 ? '16px' : node.level === 1 ? '14px' : '13px';
    el.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
    el.textContent = (node.level > 0 ? '• ' : '') + node.label;
    container.appendChild(el);

    if (node.children && node.children.length > 0) {
      var childrenContainer = document.createElement('div');
      childrenContainer.className = 'children-container';
      for (var i = 0; i < node.children.length; i++) {
        renderTree(node.children[i], childrenContainer);
      }
      container.appendChild(childrenContainer);
    }
  }

  function init() {
    var target = document.getElementById('mindmap-container') || document.getElementById('mindmap') || document.body;
    if (!target) return;
    target.style.overflowY = 'auto';
    target.style.padding = '24px';
    target.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';
    renderTree(mindmapData, target);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  global.__MINDMAP_DATA__ = mindmapData;
})(window);
