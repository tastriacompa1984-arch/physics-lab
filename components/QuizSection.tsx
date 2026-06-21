"use client";
import React, { useState, useEffect } from 'react';
import { Check, X, AlertCircle } from 'lucide-react';
import { Quiz } from '../types';

interface QuizSectionProps {
  quiz: Quiz;
  simulationId: string;
}

export const QuizSection: React.FC<QuizSectionProps> = ({ quiz, simulationId }) => {
  // Store user selection for each question index
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [showExplanations, setShowExplanations] = useState<Record<number, boolean>>({});

  // Reset state when simulation changes
  useEffect(() => {
    setSelectedAnswers({});
    setShowExplanations({});
  }, [simulationId]);

  const handleOptionClick = (questionIdx: number, optionIdx: number) => {
    // Prevent changing answer once selected
    if (selectedAnswers[questionIdx] !== undefined) return;

    setSelectedAnswers(prev => ({
      ...prev,
      [questionIdx]: optionIdx
    }));

    setShowExplanations(prev => ({
      ...prev,
      [questionIdx]: true
    }));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
        <AlertCircle size={20} style={{ color: 'var(--accent)' }} />
        <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>课堂检测 / 思考题</h3>
      </div>

      {quiz.questions.map((q, qIdx) => {
        const selectedOpt = selectedAnswers[qIdx];
        const isAnswered = selectedOpt !== undefined;
        const isCorrect = selectedOpt === q.correctAnswer;

        return (
          <div key={qIdx} className="quiz-question-box" style={{ padding: '20px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
            {/* Question Text */}
            <p style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-primary)', marginBottom: '16px' }}>
              {qIdx + 1}. {q.question}
            </p>

            {/* Options */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {q.options.map((option, oIdx) => {
                const letter = String.fromCharCode(65 + oIdx); // A, B, C, D
                const isThisSelected = selectedOpt === oIdx;
                const isThisCorrectAnswer = q.correctAnswer === oIdx;
                
                let optionClass = '';
                let style: React.CSSProperties = {};
                
                if (isAnswered) {
                  if (isThisCorrectAnswer) {
                    optionClass = 'correct'; // Green border
                  } else if (isThisSelected) {
                    optionClass = 'wrong'; // Red border
                  }
                }

                return (
                  <div
                    key={oIdx}
                    onClick={() => handleOptionClick(qIdx, oIdx)}
                    className={`quiz-option ${optionClass}`}
                    style={{
                      opacity: isAnswered && !isThisSelected && !isThisCorrectAnswer ? 0.6 : 1,
                      cursor: isAnswered ? 'default' : 'pointer',
                      ...style
                    }}
                  >
                    <span className="quiz-option-letter">{letter}</span>
                    <span style={{ fontSize: '0.9rem' }}>{option}</span>
                    
                    {/* Add checks and crosses */}
                    {isAnswered && isThisCorrectAnswer && (
                      <Check size={16} style={{ marginLeft: 'auto', color: 'var(--success)' }} />
                    )}
                    {isAnswered && isThisSelected && !isThisCorrectAnswer && (
                      <X size={16} style={{ marginLeft: 'auto', color: 'var(--error)' }} />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Explanation box */}
            {showExplanations[qIdx] && (
              <div 
                style={{
                  marginTop: '16px',
                  padding: '14px 16px',
                  borderRadius: '6px',
                  backgroundColor: 'var(--bg-tertiary)',
                  borderLeft: `4px solid ${isCorrect ? 'var(--success)' : 'var(--error)'}`,
                  fontSize: '0.85rem',
                  lineHeight: '1.5',
                  animation: 'fadeIn 0.3s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', fontWeight: 600, color: isCorrect ? 'var(--success)' : 'var(--error)' }}>
                  {isCorrect ? '回答正确！' : '回答错误。'}
                  <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>正确答案是 {String.fromCharCode(65 + q.correctAnswer)}</span>
                </div>
                <p style={{ color: 'var(--text-secondary)' }}>
                  <strong>解析：</strong>{q.explanation}
                </p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
