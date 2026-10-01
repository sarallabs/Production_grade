import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { QUESTIONS, calculatePersona } from '../data/questionnaireData';

type Theme = 'dark' | 'light' | 'gemini';

export type QuestionnaireProps = {
  theme?: Theme;
};

export default function Questionnaire({ theme = 'dark' }: QuestionnaireProps) {
  const navigate = useNavigate();
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selections, setSelections] = useState<number[]>(Array(QUESTIONS.length).fill(-1));
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [isReviewMode, setIsReviewMode] = useState(false);

  const treeLogoSrc = `${import.meta.env.BASE_URL}brand-logo.png`;

  const handleOptionSelect = (optionIdx: number) => {
    const newSelections = [...selections];
    newSelections[currentIdx] = optionIdx;
    setSelections(newSelections);

    setTimeout(() => {
      if (editingIdx !== null) {
        setEditingIdx(null);
        setIsReviewMode(true);
      } else if (currentIdx < QUESTIONS.length - 1) {
        setCurrentIdx(currentIdx + 1);
      } else {
        setIsReviewMode(true);
      }
    }, 300);
  };

  const handleEdit = (idx: number) => {
    setCurrentIdx(idx);
    setEditingIdx(idx);
    setIsReviewMode(false);
  };

  const handleFinish = () => {
    const { persona } = calculatePersona(selections);
    localStorage.setItem('questionnaire_completed', 'true');
    localStorage.setItem('user_persona', persona);
    navigate('/assessment-complete', { replace: true });
  };

  const logout = () => {
    localStorage.clear();
    navigate('/login', { replace: true });
  };

  const q = QUESTIONS[currentIdx];

  // Animation styles for dark theme
  const slideUpAnimation = `
    @keyframes slideUpFade {
      0% { opacity: 0; transform: translateY(30px); }
      100% { opacity: 1; transform: translateY(0); }
    }
  `;

  if (theme === 'light') {
    const progressPercentage = Math.round(((currentIdx + 1) / QUESTIONS.length) * 100);

    return (
      <div style={{
        backgroundColor: '#f3f4f6',
        height: '100vh',
        color: '#1f2937',
        fontFamily: "'Inter', system-ui, sans-serif",
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '40px 20px',
        overflowY: 'auto'
      }}>
        {!isReviewMode ? (
          <div style={{
            width: '100%',
            maxWidth: '640px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            marginTop: '40px'
          }}>
            {/* Top Progress Area */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
               <span style={{ color: '#4b5563', fontSize: '14px', fontWeight: 500 }}>
                 Step {currentIdx + 1} of {QUESTIONS.length}
               </span>
               <span style={{ color: '#4b5563', fontSize: '14px', fontWeight: 500 }}>
                 {progressPercentage}% Complete
               </span>
            </div>
            
            <div style={{ 
              width: '100%', 
              height: '6px', 
              background: '#e5e7eb', 
              borderRadius: '4px',
              marginBottom: '16px',
              overflow: 'hidden'
            }}>
              <div style={{ 
                width: `${progressPercentage}%`, 
                height: '100%', 
                background: '#6366f1', 
                borderRadius: '4px',
                transition: 'width 0.3s ease'
              }} />
            </div>

            {/* White Card */}
            <div style={{
              background: '#ffffff',
              borderRadius: '16px',
              padding: '40px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
              display: 'flex',
              flexDirection: 'column',
              gap: '24px'
            }}>
              <div>
                <h2 style={{
                  fontSize: '24px',
                  fontWeight: 700,
                  color: '#111827',
                  marginBottom: '8px',
                  lineHeight: '1.3'
                }}>
                  {q.text}
                </h2>

                {q.description && (
                  <p style={{
                    fontSize: '15px',
                    color: '#6b7280',
                    lineHeight: '1.5',
                    margin: 0
                  }}>
                    {q.description}
                  </p>
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {q.options.map((opt, idx) => {
                  const isSelected = selections[currentIdx] === idx;
                  return (
                    <button
                      key={idx}
                      onClick={() => handleOptionSelect(idx)}
                      style={{
                        background: isSelected ? '#f8fafc' : '#ffffff',
                        border: `1px solid ${isSelected ? '#6366f1' : '#e5e7eb'}`,
                        borderRadius: '12px',
                        padding: '16px 20px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '16px',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        width: '100%',
                        textAlign: 'left'
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.borderColor = '#d1d5db';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.borderColor = '#e5e7eb';
                        }
                      }}
                    >
                      <div style={{
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        border: `2px solid ${isSelected ? '#6366f1' : '#d1d5db'}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}>
                         {isSelected && (
                           <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#6366f1' }} />
                         )}
                      </div>
                      <span style={{ 
                        fontSize: '15px', 
                        fontWeight: 500, 
                        color: isSelected ? '#111827' : '#374151'
                      }}>
                        {opt.text}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          <div style={{
            width: '100%',
            maxWidth: '640px',
            display: 'flex',
            flexDirection: 'column',
            gap: '32px',
            marginTop: '40px'
          }}>
            <div style={{ textAlign: 'center' }}>
              <h2 style={{ fontSize: '32px', marginBottom: '16px', fontWeight: 700, color: '#111827' }}>Almost Done!</h2>
              <p style={{ color: '#6b7280', fontSize: '16px', lineHeight: '1.6' }}>
                You've completed the questionnaire. We've tailored your Saral Vidhya experience based on your responses.
              </p>
            </div>
            
            <div style={{
              background: '#ffffff',
              padding: '32px',
              borderRadius: '16px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
              textAlign: 'left'
            }}>
               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                 <h3 style={{ margin: 0, fontSize: '20px', color: '#111827', fontWeight: 600 }}>Review Your Answers</h3>
               </div>
               
               <div style={{ maxHeight: '400px', overflowY: 'auto', paddingRight: '10px' }}>
                 {QUESTIONS.map((q, idx) => (
                   <div key={q.id} style={{ 
                     marginBottom: '20px', 
                     paddingBottom: '20px', 
                     borderBottom: idx < QUESTIONS.length -1 ? '1px solid #e5e7eb' : 'none',
                     display: 'flex',
                     justifyContent: 'space-between',
                     alignItems: 'flex-start',
                     gap: '16px'
                   }}>
                      <div style={{ flex: 1 }}>
                        <p style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#6b7280', lineHeight: '1.5' }}>
                          {idx + 1}. {q.text}
                        </p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <p style={{ margin: 0, fontSize: '15px', color: '#111827', fontWeight: 500 }}>
                            {selections[idx] !== -1 ? q.options[selections[idx]].text : "No answer"}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleEdit(idx)}
                        title="Edit"
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: '#6b7280',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'color 0.2s',
                          padding: '4px'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.color = '#111827'}
                        onMouseLeave={(e) => e.currentTarget.style.color = '#6b7280'}
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M12 20h9"></path>
                          <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                        </svg>
                      </button>
                   </div>
                 ))}
               </div>
            </div>

            <button
              onClick={handleFinish}
              style={{
                background: '#6366f1',
                color: '#ffffff',
                border: 'none',
                padding: '16px 40px',
                borderRadius: '12px',
                fontSize: '16px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'transform 0.2s, background 0.2s',
                alignSelf: 'center'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.background = '#4f46e5';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.background = '#6366f1';
              }}
            >
              Finish
            </button>
          </div>
        )}
      </div>
    );
  }

  if (theme === 'gemini') {
    return (
      <div style={{
        backgroundColor: '#131314', // Gemini dark background
        height: '100vh',
        width: '100vw',
        color: '#e3e3e3',
        fontFamily: "'Google Sans', 'Inter', system-ui, sans-serif",
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden' // for the glow effect
      }}>
        {/* Background Glow */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '120vw',
          height: '120vh',
          background: 'radial-gradient(circle at center, rgba(59, 130, 246, 0.45) 0%, rgba(37, 99, 235, 0.2) 35%, transparent 70%)',
          pointerEvents: 'none',
          zIndex: 0
        }} />

        {/* Main Content */}
        <main style={{
          position: 'relative',
          zIndex: 1,
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '80px 20px 60px',
          overflowY: 'auto'
        }}>
          {!isReviewMode ? (
            <div style={{ width: '100%', maxWidth: '720px', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '40px', margin: 'auto' }}>
              
              {currentIdx === 0 && (
                <div style={{ marginBottom: '-20px' }}>
                  <span style={{ 
                    background: 'rgba(168, 199, 250, 0.1)', 
                    color: '#a8c7fa', 
                    padding: '8px 16px', 
                    borderRadius: '20px', 
                    fontSize: '14px', 
                    fontWeight: 500,
                    letterSpacing: '1px',
                    textTransform: 'uppercase'
                  }}>
                    Let's Personify You
                  </span>
                </div>
              )}

              {/* Question Text ("Ready when you are") */}
              <div>
                <h2 style={{
                  fontSize: '32px',
                  fontWeight: 400,
                  color: '#ffffff',
                  marginBottom: '16px',
                  lineHeight: '1.4'
                }}>
                  {q.text}
                </h2>
                {q.description && (
                  <p style={{ 
                    fontSize: '16px', 
                    color: '#a8c7fa', 
                    opacity: 0.9, 
                    maxWidth: '600px', 
                    margin: '0 auto', 
                    lineHeight: '1.6',
                    fontStyle: 'italic'
                  }}>
                    {q.description}
                  </p>
                )}
              </div>

              {/* Options as Text Boxes */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%', maxWidth: '640px', margin: '0 auto' }}>
                {q.options.map((opt, idx) => {
                  const isSelected = selections[currentIdx] === idx;
                  return (
                    <button
                      key={idx}
                      onClick={() => handleOptionSelect(idx)}
                      style={{
                        background: isSelected ? 'rgba(168, 199, 250, 0.12)' : '#1e1f20',
                        border: isSelected ? '1px solid rgba(168, 199, 250, 0.5)' : '1px solid transparent',
                        borderRadius: '32px', // High border radius like Gemini text box
                        padding: '20px 28px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        width: '100%',
                        textAlign: 'left'
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.background = '#2a2b2c';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.background = '#1e1f20';
                        }
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                         {/* + Icon from Gemini */}
                         <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={isSelected ? '#a8c7fa' : '#c4c7c5'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                           <line x1="12" y1="5" x2="12" y2="19"></line>
                           <line x1="5" y1="12" x2="19" y2="12"></line>
                         </svg>
                         <span style={{ fontSize: '16px', color: isSelected ? '#a8c7fa' : '#e3e3e3', fontWeight: 400, lineHeight: '1.4' }}>
                           {opt.text}
                         </span>
                      </div>
                      {isSelected && (
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#a8c7fa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div style={{ width: '100%', maxWidth: '720px', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '32px', margin: 'auto' }}>
              <h2 style={{ fontSize: '36px', fontWeight: 400, color: '#ffffff' }}>Almost Done!</h2>
              <div style={{
                background: '#1e1f20',
                borderRadius: '24px',
                padding: '36px',
                textAlign: 'left',
                color: '#e3e3e3'
              }}>
                 <h3 style={{ margin: '0 0 24px 0', fontSize: '20px', color: '#a8c7fa', fontWeight: 500 }}>
                   Review Your Answers
                 </h3>
                 <div style={{ maxHeight: '50vh', overflowY: 'auto', paddingRight: '10px' }}>
                   {QUESTIONS.map((q, idx) => (
                     <div key={q.id} style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '20px' }}>
                        <div>
                          <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#8e918f', lineHeight: '1.5' }}>{idx + 1}. {q.text}</p>
                          <p style={{ margin: 0, fontSize: '16px', color: '#e3e3e3', fontWeight: 500 }}>
                            {selections[idx] !== -1 ? q.options[selections[idx]].text : "No answer"}
                          </p>
                        </div>
                        <button
                          onClick={() => handleEdit(idx)}
                          title="Edit"
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#8e918f',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'color 0.2s',
                            padding: '4px'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.color = '#ffffff'}
                          onMouseLeave={(e) => e.currentTarget.style.color = '#8e918f'}
                        >
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 20h9"></path>
                            <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                          </svg>
                        </button>
                     </div>
                   ))}
                 </div>
              </div>
              <button
                onClick={handleFinish}
                style={{
                  background: '#a8c7fa',
                  color: '#041e49',
                  border: 'none',
                  padding: '16px 40px',
                  borderRadius: '32px',
                  fontSize: '16px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  alignSelf: 'center'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#d3e3fd'}
                onMouseLeave={(e) => e.currentTarget.style.background = '#a8c7fa'}
              >
                Finish
              </button>
            </div>
          )}
        </main>
      </div>
    );
  }

  // Default Dark Theme (from Questionnaire.tsx)
  return (
    <div style={{
      backgroundColor: '#0d0d0d',
      height: '100vh',
      overflowY: 'auto',
      color: '#ffffff',
      fontFamily: "'Inter', system-ui, sans-serif"
    }}>
      <header style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '24px 40px',
        borderBottom: '1px solid #1a1a1a'
      }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <img
            src={treeLogoSrc}
            alt="Saral Vidhya"
            style={{ height: '36px', objectFit: 'contain', filter: 'brightness(0) invert(1)' }}
          />
        </div>
        <div>
          <button onClick={logout} style={{
            background: 'transparent',
            color: '#888',
            border: 'none',
            cursor: 'pointer',
            fontSize: '14px',
            transition: 'color 0.2s',
            fontWeight: 500
          }}
          onMouseEnter={(e) => e.currentTarget.style.color = '#fff'}
          onMouseLeave={(e) => e.currentTarget.style.color = '#888'}
          >
            Log Out
          </button>
        </div>
      </header>

      <main style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '40px 20px',
        minHeight: 'calc(100vh - 85px)',
        overflowY: 'auto'
      }}>
        
        {!isReviewMode ? (
          <div key={`question-${currentIdx}`} style={{ 
            width: '100%', 
            maxWidth: '900px', 
            textAlign: 'center', 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '40px',
            animation: 'slideUpFade 0.4s ease-out forwards',
            margin: '0 auto'
          }}>
            <style>{slideUpAnimation}</style>
            
            <div style={{ textAlign: 'center' }}>
              {q.description && (
                <div style={{ marginBottom: '24px' }}>
                  <div style={{
                    fontSize: '13px',
                    color: '#888',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    marginBottom: '12px',
                    fontWeight: 600
                  }}>
                    Read the text and answer the question below
                  </div>
                  <div style={{
                    background: 'rgba(255,255,255,0.03)',
                    padding: '24px',
                    borderRadius: '16px',
                    fontSize: '15px',
                    lineHeight: '1.6',
                    color: '#aaaaaa',
                    fontStyle: 'italic',
                    borderLeft: '4px solid #4a4a4a',
                    textAlign: 'left'
                  }}>
                    {q.description}
                  </div>
                </div>
              )}

              <h2 style={{
                fontSize: '26px',
                fontWeight: 600,
                marginBottom: '0',
                color: '#ffffff',
                lineHeight: '1.4'
              }}>
                {q.text}
              </h2>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: q.options.length === 4 ? 'repeat(2, 1fr)' : `repeat(${q.options.length}, 1fr)`,
              gap: '24px',
              maxWidth: q.options.length === 4 ? '600px' : '100%',
              margin: '0 auto',
              width: '100%'
            }}>
              {q.options.map((opt, idx) => {
                const isSelected = selections[currentIdx] === idx;
                return (
                  <div key={idx} style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '16px',
                    gridColumn: 'span 1'
                  }}>
                    <button
                      onClick={() => handleOptionSelect(idx)}
                      style={{
                        background: isSelected ? 'rgba(255,255,255,0.1)' : '#151515',
                        border: `2px solid ${isSelected ? '#ffffff' : '#222'}`,
                        borderRadius: '24px',
                        width: '100%',
                        maxWidth: '220px',
                        aspectRatio: '1 / 1',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        padding: 0
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.background = '#1a1a1a';
                          e.currentTarget.style.borderColor = '#333';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.background = '#151515';
                          e.currentTarget.style.borderColor = '#222';
                        }
                      }}
                    >
                      <span style={{ fontSize: '100px', lineHeight: 1 }}>{opt.icon}</span>
                    </button>
                    <span style={{ 
                      fontSize: '16px', 
                      fontWeight: 500, 
                      textAlign: 'center', 
                      lineHeight: '1.4',
                      color: isSelected ? '#ffffff' : '#888888',
                      maxWidth: '80%'
                    }}>
                      {opt.text}
                    </span>
                  </div>
                );
              })}
            </div>

            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '12px',
              marginTop: '40px'
            }}>
               <div style={{ width: '100%', height: '3px', background: '#1a1a1a', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ 
                    width: `${((currentIdx + 1) / QUESTIONS.length) * 100}%`, 
                    height: '100%', 
                    background: '#ffffff', 
                    borderRadius: '4px',
                    transition: 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
                  }}></div>
               </div>
               <span style={{ color: '#666', fontSize: '13px', fontWeight: 500, letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                 Progress {currentIdx + 1}/{QUESTIONS.length}
               </span>
            </div>

          </div>
        ) : (
          <div style={{
            width: '100%',
            maxWidth: '640px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            gap: '32px',
            margin: 'auto'
          }}>
            <div>
              <h2 style={{ fontSize: '32px', marginBottom: '16px', fontWeight: 600 }}>Almost Done!</h2>
              <p style={{ color: '#888', fontSize: '16px', lineHeight: '1.6' }}>
                You've completed the questionnaire. We've tailored your Saral Vidhya experience based on your responses.
              </p>
            </div>
            
            <div style={{
              background: '#151515',
              padding: '32px',
              borderRadius: '24px',
              border: '1px solid #222',
              textAlign: 'left'
            }}>
               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                 <h3 style={{ margin: 0, fontSize: '20px', color: '#fff', fontWeight: 600 }}>Summary</h3>
               </div>
               
               <div style={{ maxHeight: '400px', overflowY: 'auto', paddingRight: '10px' }}>
                 {QUESTIONS.map((q, idx) => (
                   <div key={q.id} style={{ 
                     marginBottom: '20px', 
                     paddingBottom: '20px', 
                     borderBottom: idx < QUESTIONS.length -1 ? '1px solid #222' : 'none' 
                   }}>
                      <p style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#888', lineHeight: '1.5' }}>
                        {idx + 1}. {q.text}
                      </p>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ fontSize: '20px' }}>
                            {selections[idx] !== -1 ? q.options[selections[idx]].icon : "❓"}
                          </span>
                          <p style={{ margin: 0, fontSize: '15px', color: '#fff', fontWeight: 500 }}>
                            {selections[idx] !== -1 ? q.options[selections[idx]].text : "No answer"}
                          </p>
                        </div>
                        <button
                          onClick={() => handleEdit(idx)}
                          title="Edit"
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#888',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'color 0.2s',
                            padding: '4px'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.color = '#fff'}
                          onMouseLeave={(e) => e.currentTarget.style.color = '#888'}
                        >
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 20h9"></path>
                            <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                          </svg>
                        </button>
                      </div>
                   </div>
                 ))}
               </div>
            </div>

            <button
              onClick={handleFinish}
              style={{
                background: '#ffffff',
                color: '#000000',
                border: 'none',
                padding: '18px 40px',
                borderRadius: '16px',
                fontSize: '16px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'transform 0.2s, background 0.2s',
                alignSelf: 'center'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.background = '#f0f0f0';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.background = '#ffffff';
              }}
            >
              Finish
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
