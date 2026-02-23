// components/student/QuizModal.jsx

import './QuizModal.css';
import React, { useState } from "react";

const QuizModal = ({ questions, noteTitle, onClose }) => {
    const [userAnswers, setUserAnswers] = useState(Array(questions.length).fill(null));
    const [submitted, setSubmitted] = useState(false);

    const handleSelect = (qIndex, option) => {
        if (submitted) return;
        const updated = [...userAnswers];
        updated[qIndex] = option;
        setUserAnswers(updated);
    };

    const allAnswered = userAnswers.every((a) => a !== null);

    const score = submitted
        ? questions.reduce((acc, q, i) => acc + (userAnswers[i] === q.answer ? 1 : 0), 0)
        : 0;

    const handleRetry = () => {
        setUserAnswers(Array(questions.length).fill(null));
        setSubmitted(false);
    };

    return (
        <div className="quiz-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className="quiz-modal">
                {/* Header */}
                <div className="quiz-modal-header">
                    <div>
                        <h2 className="quiz-title">Quiz</h2>
                        <p className="quiz-subtitle">{noteTitle}</p>
                    </div>
                    <button className="quiz-close-btn" onClick={onClose} aria-label="Close quiz">
                        ✕
                    </button>
                </div>

                {/* Score banner after submit */}
                {submitted && (
                    <div className={`score-banner ${score >= 4 ? "excellent" : score >= 2 ? "good" : "needs-work"}`}>
                        <span className="score-emoji">
                            {score === 5 ? "🏆" : score >= 3 ? "👍" : "📚"}
                        </span>
                        <div>
                            <p className="score-text">
                                You scored <strong>{score}/{questions.length}</strong>
                            </p>
                            <p className="score-sub">
                                {score === 5
                                    ? "Perfect score! Outstanding!"
                                    : score >= 3
                                        ? "Good job! Review the ones you missed."
                                        : "Keep studying and try again!"}
                            </p>
                        </div>
                    </div>
                )}

                {/* Questions */}
                <div className="quiz-questions">
                    {questions.map((q, qIndex) => {
                        const userAns = userAnswers[qIndex];
                        const correct = q.answer;
                        return (
                            <div key={qIndex} className="quiz-question-block">
                                <p className="quiz-question-text">
                                    <span className="question-number">Q{qIndex + 1}.</span> {q.question}
                                </p>
                                <div className="quiz-options">
                                    {q.options.map((option, oIndex) => {
                                        let optionClass = "quiz-option";
                                        if (submitted) {
                                            if (option === correct) optionClass += " correct";
                                            else if (option === userAns && userAns !== correct)
                                                optionClass += " wrong";
                                            else optionClass += " neutral";
                                        } else if (userAns === option) {
                                            optionClass += " selected";
                                        }

                                        return (
                                            <button
                                                key={oIndex}
                                                className={optionClass}
                                                onClick={() => handleSelect(qIndex, option)}
                                                disabled={submitted}
                                            >
                                                {submitted && option === correct && (
                                                    <span className="option-icon">✓</span>
                                                )}
                                                {submitted && option === userAns && userAns !== correct && (
                                                    <span className="option-icon">✗</span>
                                                )}
                                                {option}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Footer */}
                <div className="quiz-footer">
                    {!submitted ? (
                        <button
                            className={`quiz-submit-btn ${!allAnswered ? "disabled" : ""}`}
                            onClick={() => setSubmitted(true)}
                            disabled={!allAnswered}
                            title={!allAnswered ? "Please answer all questions before submitting" : ""}
                        >
                            Submit Answers
                        </button>
                    ) : (
                        <div className="quiz-post-submit">
                            <button className="quiz-retry-btn" onClick={handleRetry}>
                                🔄 Try Again
                            </button>
                            <button className="quiz-done-btn" onClick={onClose}>
                                Done
                            </button>
                        </div>
                    )}
                    {!submitted && !allAnswered && (
                        <p className="quiz-hint">Answer all {questions.length} questions to submit</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default QuizModal;