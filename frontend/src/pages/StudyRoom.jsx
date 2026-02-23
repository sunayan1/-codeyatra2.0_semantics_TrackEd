import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import BookshelfModal from "./BookshelfModal";
import CalendarModal from "./CalenderModal";
import TodoModal from "./TodoModal";
import SpotifyModal from "./SpotifyModal";
import TrashModal from "./TrashModal";
import PomodoroModal from "./PomodoroModal";
import "./style/Bookshelf.css";
import "./style/CalendarModal.css";
import "./style/TodoModal.css";
import "./style/SpotifyModal.css";
import "./style/TrashModal.css";
import "./style/StudyRoom.css";

const StudyRoom = () => {
  const navigate = useNavigate();
  const [isBookshelfOpen, setIsBookshelfOpen] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isTodoOpen, setIsTodoOpen] = useState(false);
  const [isSpotifyOpen, setIsSpotifyOpen] = useState(false);
  const [isTrashOpen, setIsTrashOpen] = useState(false);
  const [isPomodoroOpen, setIsPomodoroOpen] = useState(false);

  // Pomodoro State
  const [timeLeft, setTimeLeft] = useState(0); // in seconds
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    let interval = null;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsActive(false);
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && isActive) {
        setIsActive(false);
        setTimeLeft(0);
        alert("Focus interrupted! Pomodoro timer has been reset.");
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [isActive]);

  const startPomodoro = (minutes) => {
    setTimeLeft(minutes * 60);
    setIsActive(true);
    setIsPomodoroOpen(false);
  };

  const handleHotspotClick = (setter, value) => {
    setter(value);
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className={`app ${isActive ? "room-locked" : ""}`}>

      {/* VIDEO BACKGROUND */}
      <video className="room-video" src="/assets/video.mp4" autoPlay muted loop />

      {/* Back Button */}
      {!isActive && (
        <button className="room-back-btn" onClick={() => navigate("/student")}>
          ← Back to Dashboard
        </button>
      )}

      {/* DIGITAL CLOCK OVERLAY */}
      {isActive && (
        <div className="digital-clock-overlay">
          <div className="digital-clock-face">
            <span className="timer-icon">⏳</span>
            {formatTime(timeLeft)}
          </div>
          <div className="lock-indicator">Room Locked - Focus Mode</div>
          <button className="cancel-timer-btn" onClick={() => setIsActive(false)}>Cancel Session</button>
        </div>
      )}

      {/* HOTSPOTS */}
      <div className={`hotspot headphone ${isActive ? "locked" : ""}`} data-tip="🎧 Music" onClick={() => handleHotspotClick(setIsSpotifyOpen, true)} />
      <div className={`hotspot calendar ${isActive ? "locked" : ""}`} data-tip="📅 Calendar" onClick={() => handleHotspotClick(setIsCalendarOpen, true)} />
      <div className={`hotspot bookshelf ${isActive ? "locked" : ""}`} data-tip="📚 Bookshelf" onClick={() => handleHotspotClick(setIsBookshelfOpen, true)} />
      <div className={`hotspot whiteboard ${isActive ? "locked" : ""}`} data-tip="📝 Whiteboard" onClick={() => handleHotspotClick(setIsTodoOpen, true)} />
      <div className={`hotspot dustbin ${isActive ? "locked" : ""}`} data-tip="🗑️ Trash" onClick={() => handleHotspotClick(setIsTrashOpen, true)} />
      <div className={`hotspot clock ${isActive ? "locked" : ""}`} data-tip="⏲️ Pomodoro" onClick={() => setIsPomodoroOpen(true)} />
      <div className="hotspot cat" />

      {/* MODALS */}
      {isBookshelfOpen && <BookshelfModal onClose={() => setIsBookshelfOpen(false)} />}
      {isCalendarOpen && <CalendarModal onClose={() => setIsCalendarOpen(false)} />}
      {isTodoOpen && <TodoModal onClose={() => setIsTodoOpen(false)} />}
      {isSpotifyOpen && <SpotifyModal onClose={() => setIsSpotifyOpen(false)} />}
      {isTrashOpen && <TrashModal onClose={() => setIsTrashOpen(false)} />}
      {isPomodoroOpen && (
        <PomodoroModal
          onClose={() => setIsPomodoroOpen(false)}
          onStart={startPomodoro}
          activeTimer={timeLeft > 0 && isActive ? timeLeft : null}
        />
      )}
    </div>
  );
};

export default StudyRoom;
