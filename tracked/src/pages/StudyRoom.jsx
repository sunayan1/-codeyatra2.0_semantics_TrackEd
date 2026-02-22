import { useState } from "react";
import { useNavigate } from "react-router-dom";
import BookshelfModal from "./BookshelfModal";
import CalendarModal from "./CalenderModal";
import TodoModal from "./TodoModal";
import SpotifyModal from "./SpotifyModal";
import TrashModal from "./TrashModal";
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

  return (
    <div className="app">

      {/* VIDEO BACKGROUND */}
      <video className="room-video" src="/assets/video.mp4" autoPlay muted loop />

      {/* Back Button */}
      <button className="room-back-btn" onClick={() => navigate("/student")}>
        ← Back to Dashboard
      </button>

      {/* HOTSPOTS */}
      <div className="hotspot headphone" data-tip="🎧 Music" onClick={() => setIsSpotifyOpen(true)} />
      <div className="hotspot calendar" data-tip="📅 Calendar" onClick={() => setIsCalendarOpen(true)} />
      <div className="hotspot bookshelf" data-tip="📚 Bookshelf" onClick={() => setIsBookshelfOpen(true)} />
      <div className="hotspot whiteboard" data-tip="📝 Whiteboard" onClick={() => setIsTodoOpen(true)} />
      <div className="hotspot dustbin" data-tip="🗑️ Trash" onClick={() => setIsTrashOpen(true)} />
      <div className="hotspot cat" />

      {/* MODALS */}
      {isBookshelfOpen && <BookshelfModal onClose={() => setIsBookshelfOpen(false)} />}
      {isCalendarOpen && <CalendarModal onClose={() => setIsCalendarOpen(false)} />}
      {isTodoOpen && <TodoModal onClose={() => setIsTodoOpen(false)} />}
      {isSpotifyOpen && <SpotifyModal onClose={() => setIsSpotifyOpen(false)} />}
      {isTrashOpen && <TrashModal onClose={() => setIsTrashOpen(false)} />}
    </div>
  );
};

export default StudyRoom;
