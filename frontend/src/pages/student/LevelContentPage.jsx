import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { LEARNING_DATA } from "../../data/learningData";
import { useAuth } from "../../context/AuthContext";
import "./LevelContentPage.css";

const LevelContentPage = () => {
    const { subjectId, levelId } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [currentSlide, setCurrentSlide] = useState(0);
    const [showQuiz, setShowQuiz] = useState(false);
    const [quizIndex, setQuizIndex] = useState(0);
    const [score, setScore] = useState(0);
    const [quizFinished, setQuizFinished] = useState(false);

    const subject = LEARNING_DATA[subjectId];
    const level = subject?.chapters[0].levels.find(l => l.id === levelId);

    if (!level) return <div className="error-page">Level not found</div>;

    const handleNextSlide = () => {
        if (currentSlide < level.slides.length - 1) {
            setCurrentSlide(currentSlide + 1);
        } else {
            setShowQuiz(true);
        }
    };

    const handleAnswer = (optionIndex) => {
        const isCorrect = optionIndex === level.quiz[quizIndex].answer;
        const newScore = isCorrect ? score + 1 : score;
        
        if (isCorrect) {
            setScore(newScore);
        }

        if (quizIndex < level.quiz.length - 1) {
            setQuizIndex(quizIndex + 1);
        } else {
            setQuizFinished(true);
            if (newScore === level.quiz.length) {
                saveProgress();
            }
        }
    };

    const handleRetry = () => {
        setQuizIndex(0);
        setScore(0);
        setQuizFinished(false);
        setShowQuiz(false);
        setCurrentSlide(0);
    };

    const saveProgress = () => {
        if (!user || !user.email) return;
        const key = `progress_${user.email}_${subjectId}`;
        const savedProgress = JSON.parse(localStorage.getItem(key) || "{}");
        savedProgress[levelId] = "completed";
        localStorage.setItem(key, JSON.stringify(savedProgress));
    };

    if (quizFinished) {
        const passed = score === level.quiz.length;
        return (
            <div className="content-overlay">
                <div className="result-card">
                    <h2>{passed ? "Level Completed!" : "Quiz Failed!"}</h2>
                    <div className={`score-badge ${passed ? "passed" : "failed"}`}>
                        {Math.round((score / level.quiz.length) * 100)}%
                    </div>
                    <p>{passed ? "You've unlocked the next level!" : "Review the content and try again."}</p>
                    <div className="result-actions">
                        {!passed && (
                            <button className="primary-btn" onClick={handleRetry}>
                                Try Again
                            </button>
                        )}
                        <button className={passed ? "primary-btn" : "secondary-btn"} onClick={() => navigate(`/student/subject/${subjectId}`)}>
                            Back to Roadmap
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (showQuiz) {
        const currentQuestion = level.quiz[quizIndex];
        return (
            <div className="content-overlay">
                <div className="quiz-card">
                    <div className="quiz-header">
                        <span>Question {quizIndex + 1} of {level.quiz.length}</span>
                        <div className="progress-bar">
                            <div className="progress-fill" style={{ width: `${((quizIndex + 1) / level.quiz.length) * 100}%` }}></div>
                        </div>
                    </div>
                    <h2>{currentQuestion.question}</h2>
                    <div className="options-grid">
                        {currentQuestion.options.map((option, index) => (
                            <button key={index} className="option-btn" onClick={() => handleAnswer(index)}>
                                {option}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="content-overlay">
            <div className="slide-card">
                <div className="slide-header">
                    <button className="back-link" onClick={() => navigate(`/student/subject/${subjectId}`)}>
                        Back
                    </button>
                    <div className="slide-counter">Slide {currentSlide + 1} / {level.slides.length}</div>
                </div>

                <div className="slide-content">
                    <h1>{level.slides[currentSlide].title}</h1>
                    <p>{level.slides[currentSlide].content}</p>
                </div>

                <div className="slide-footer">
                    <button className="primary-btn" onClick={handleNextSlide}>
                        {currentSlide === level.slides.length - 1 ? "Start Quiz" : "Next Slide"}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LevelContentPage;
