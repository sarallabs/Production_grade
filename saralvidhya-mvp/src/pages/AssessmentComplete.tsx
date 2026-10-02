import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';

export default function AssessmentComplete() {
  const navigate = useNavigate();
  const [persona, setPersona] = useState('intermediate');

  useEffect(() => {
    const p = localStorage.getItem('user_persona') || localStorage.getItem('persona') || localStorage.getItem('global_persona') || 'intermediate';
    setPersona(p.toLowerCase());
  }, []);

  const getPersonaDetails = () => {
    switch (persona) {
      case 'beginner':
        return {
          title: 'BEGINNER',
          imgSrc: `${import.meta.env.BASE_URL}personas/beginner.png`,
          message: 'Every expert was once a beginner. You are at the start of an incredible journey.',
          color: '#10B981'
        };
      case 'advanced':
        return {
          title: 'ADVANCED',
          imgSrc: `${import.meta.env.BASE_URL}personas/advanced.png`,
          message: 'Outstanding. You are ready to tackle the toughest challenges and achieve mastery.',
          color: '#F59E0B'
        };
      case 'intermediate':
      default:
        return {
          title: 'INTERMEDIATE',
          imgSrc: `${import.meta.env.BASE_URL}personas/intermediate.png`,
          message: 'You have a solid foundation. Now, it is time to sharpen those skills and dive deeper.',
          color: '#3B82F6'
        };
    }
  };

  const details = getPersonaDetails();

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#000000',
      color: '#ffffff',
      fontFamily: "'Inter', sans-serif",
      padding: '20px',
      textAlign: 'center'
    }}>
      <h1 style={{
        fontSize: '1.8rem',
        marginBottom: '80px',
        fontWeight: '300',
        letterSpacing: '4px',
        color: '#E5E7EB',
        textTransform: 'uppercase'
      }}>
        Assessment Complete
      </h1>

      <div style={{
        width: '160px',
        height: '160px',
        marginBottom: '60px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        animation: 'fadeUp 1.2s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        borderRadius: '30px',
        overflow: 'hidden'
      }}>
        <img
          src={details.imgSrc}
          alt={details.title}
          style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: '30px' }}
        />
      </div>

      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        animation: 'fadeUp 1.2s cubic-bezier(0.16, 1, 0.3, 1) 0.15s forwards',
        opacity: 0
      }}>
        <h2 style={{
          fontSize: '1rem',
          color: details.color,
          letterSpacing: '6px',
          marginBottom: '24px',
          textTransform: 'uppercase',
          fontWeight: '600'
        }}>
          YOU ARE {details.title === 'BEGINNER' ? 'A' : 'AN'} {details.title}
        </h2>

        <p style={{
          fontSize: '1.05rem',
          maxWidth: '460px',
          lineHeight: '1.8',
          marginBottom: '60px',
          color: '#9CA3AF',
          fontWeight: '300'
        }}>
          {details.message}
        </p>

        <button
          onClick={() => navigate('/', { replace: true })}
          style={{
            padding: '14px 48px',
            fontSize: '0.9rem',
            fontWeight: '600',
            color: '#000000',
            backgroundColor: '#ffffff',
            border: 'none',
            borderRadius: '30px',
            cursor: 'pointer',
            letterSpacing: '2px',
            textTransform: 'uppercase',
            transition: 'all 0.3s ease',
            marginBottom: '40px'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.backgroundColor = '#E5E7EB';
            e.currentTarget.style.transform = 'translateY(-2px)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.backgroundColor = '#ffffff';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          Start Learning
        </button>

        <div
          onClick={() => {
            localStorage.removeItem('questionnaire_completed');
            navigate('/questionnaire', { replace: true });
          }}
          style={{
            color: '#4B5563',
            cursor: 'pointer',
            fontSize: '0.8rem',
            letterSpacing: '1px',
            transition: 'color 0.3s',
            textTransform: 'uppercase'
          }}
          onMouseOver={(e) => e.currentTarget.style.color = '#9CA3AF'}
          onMouseOut={(e) => e.currentTarget.style.color = '#4B5563'}
        >
        </div>
      </div>

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
