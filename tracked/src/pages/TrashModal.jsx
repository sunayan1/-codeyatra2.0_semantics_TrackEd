import { useEffect, useState } from "react";
import { trashAPI } from "../services/api";
import "./style/TrashModal.css";

const TrashModal = ({ onClose }) => {
    const [trash, setTrash] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    // Load trash items from API
    useEffect(() => {
        const loadTrash = async () => {
            try {
                const response = await trashAPI.getAll();
                setTrash(response.data || []);
            } catch (error) {
                console.error("Error loading trash:", error);
            } finally {
                setIsLoading(false);
            }
        };
        loadTrash();
    }, []);

    const handleRestore = async (item) => {
        try {
            await trashAPI.restore(item.trash_id);
            setTrash(trash.filter(t => t.trash_id !== item.trash_id));
        } catch (error) {
            console.error("Error restoring item:", error);
            alert("Failed to restore item. Please try again.");
        }
    };

    const handleDelete = async (id) => {
        try {
            await trashAPI.deletePermanently(id);
            setTrash(trash.filter(t => t.trash_id !== id));
        } catch (error) {
            console.error("Error deleting item:", error);
            alert("Failed to delete item. Please try again.");
        }
    };

    return (
        <div className="trash-overlay">
            <div className="trash-modal">
                <header>
                    <h2>🗑️ Trash</h2>
                    <button className="close-btn" onClick={onClose}>✕</button>
                </header>

                <div className="trash-content">
                    {isLoading ? (
                        <p className="empty">Loading trash...</p>
                    ) : trash.length === 0 ? (
                        <p className="empty">Trash is empty</p>
                    ) : (
                        trash.map(item => (
                            <div key={item.trash_id} className="trash-item">
                                <div className="trash-info">
                                    <strong>{item.item_data?.name || item.item_data?.title || item.item_data?.content || item.item_data?.event_text || item.item_data?.text || "Unnamed Item"}</strong>
                                    <span className="item-meta">{item.item_type} - {item.deleted_at ? new Date(item.deleted_at).toLocaleDateString() : 'Unknown date'}</span>
                                </div>

                                <div className="actions">
                                    <button className="restore-btn" onClick={() => handleRestore(item)}>Restore</button>
                                    <button className="danger-btn" onClick={() => handleDelete(item.trash_id)}>
                                        Delete
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <button className="close-all" onClick={onClose}>Close</button>
            </div>
        </div>
    );
};

export default TrashModal;
