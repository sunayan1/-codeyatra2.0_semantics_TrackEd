import { useState } from "react";
import { quizAPI } from "../services/api";
import "./style/Quiz.css";

const QuizModal = ({ quiz, onClose, onCompleted }) => {
    const [answers, setAnswers] = useState(Array(quiz.questions.length).fill(""));
    const [submitted, setSubmitted] = useState(false);
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(0);
    const questionsPerPage = 5;
    const totalPages = Math.ceil(quiz.questions.length / questionsPerPage);

    const selectAnswer = (qIndex, option) => {
        if (submitted) return;
        const updated = [...answers];
        updated[qIndex] = option;
        setAnswers(updated);
    };

    const handleSubmit = async () => {
        const unanswered = answers.filter(a => !a).length;
        if (unanswered > 0) {
            return alert(`Please answer all questions. ${unanswered} unanswered.`);
        }

        setLoading(true);
        try {
            const res = await quizAPI.submitAttempt(quiz.id, answers);
            if (res.data?.success) {
                setResult(res.data.data);
                setSubmitted(true);
                setCurrentPage(0); // Reset to first page to show score
                if (onCompleted) onCompleted(res.data.data);
            } else {
                alert(res.data?.error || "Failed to submit quiz");
            }
        } catch (err) {
            alert(err.message || "Error submitting quiz");
        }
        setLoading(false);
    };

    const startIdx = currentPage * questionsPerPage;
    const endIdx = Math.min(startIdx + questionsPerPage, quiz.questions.length);
    const pageQuestions = quiz.questions.slice(startIdx, endIdx);
    const answeredCount = answers.filter(a => a).length;
    const progressPercent = (answeredCount / quiz.questions.length) * 100;

    const getScoreMessage = (score, total) => {
        const pct = (score / total) * 100;
        if (pct === 100) return "Perfect Score! Outstanding!";
        if (pct >= 80) return "Excellent work!";
        if (pct >= 60) return "Good job! Keep it up!";
        if (pct >= 40) return "Not bad, but review the material.";
        return "Keep studying! You'll improve!";
    };

    const getScoreColor = (score, total) => {
        const pct = (score / total) * 100;
        if (pct >= 80) return '#22c55e';
        if (pct >= 50) return '#eab308';
        return '#ef4444';
    };

    return (
        <div className="quiz-modal-overlay" onClick={onClose}>
            <div className="quiz-modal" onClick={(e) => e.stopPropagation()}>
                <div className="quiz-modal-header">
                    <div>
                        <h2>{quiz.title}</h2>
                        {!submitted && (
                            <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginTop: '0.3rem' }}>
                                {answeredCount}/{quiz.questions.length} answered
                            </p>
                        )}
                    </div>
                    <button className="quiz-close-btn" onClick={onClose}>X</button>
                </div>

                {/* Progress bar */}
                {!submitted && (
                    <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: '8px', height: '6px', marginBottom: '1.5rem', overflow: 'hidden' }}>
                        <div style={{ width: `${progressPercent}%`, height: '100%', background: 'linear-gradient(90deg, #6366f1, #22c55e)', borderRadius: '8px', transition: 'width 0.3s' }}></div>
                    </div>
                )}

                {/* Score card */}
                {submitted && result && (
                    <div className="quiz-score-card">
                        <div className="score-big" style={{ WebkitTextFillColor: getScoreColor(result.score, result.total) }}>
                            {result.score}/{result.total}
                        </div>
                        <div className="score-label">{getScoreMessage(result.score, result.total)}</div>
                        <div style={{ marginTop: '0.8rem', fontSize: '0.9rem', color: '#94a3b8' }}>
                            {Math.round((result.score / result.total) * 100)}% correct
                        </div>
                    </div>
                )}

                {/* Questions */}
                {pageQuestions.map((q, pageIdx) => {
                    const i = startIdx + pageIdx;
                    return (
                        <div className="quiz-question-card" key={i}>
                            <div className="question-number">Question {i + 1} of {quiz.questions.length}</div>
                            <div className="question-text">{q.question}</div>
                            <div className="quiz-options">
                                {q.options.map((opt, j) => {
                                    let cls = "quiz-option";
                                    if (submitted) {
                                        if (opt === q.answer) cls += " correct";
                                        else if (opt === answers[i] && opt !== q.answer) cls += " wrong";
                                    } else if (answers[i] === opt) {
                                        cls += " selected";
                                    }
                                    return (
                                        <div key={j} className={cls} onClick={() => selectAnswer(i, opt)}>
                                            {opt}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}

                {/* Pagination */}
                {totalPages > 1 && (
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', margin: '1rem 0' }}>
                        {Array.from({ length: totalPages }, (_, p) => (
                            <button
                                key={p}
                                onClick={() => setCurrentPage(p)}
                                style={{
                                    width: 36, height: 36, borderRadius: '10px', border: 'none', cursor: 'pointer',
                                    background: currentPage === p ? '#6366f1' : 'rgba(255,255,255,0.1)',
                                    color: 'white', fontWeight: currentPage === p ? 700 : 400,
                                    transition: 'all 0.2s'
                                }}
                            >
                                {p + 1}
                            </button>
                        ))}
                    </div>
                )}

                {!submitted && (
                    <button
                        className="quiz-submit-btn"
                        onClick={handleSubmit}
                        disabled={loading || answeredCount < quiz.questions.length}
                    >
                        {loading ? "Submitting..." : `Submit Quiz (${answeredCount}/${quiz.questions.length} answered)`}
                    </button>
                )}
            </div>
        </div>
    );
};

export default QuizModal;
