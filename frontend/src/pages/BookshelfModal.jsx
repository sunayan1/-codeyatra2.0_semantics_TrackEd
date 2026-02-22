import { useEffect, useState } from "react";
import { filesAPI } from "../services/api";
import "./style/Bookshelf.css";


const BookshelfModal = ({ onClose }) => {
    const [files, setFiles] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    // Load files from API
    useEffect(() => {
        const loadFiles = async () => {
            try {
                const response = await filesAPI.getAll();
                setFiles(response.data || []);
            } catch (error) {
                console.error("Error loading files:", error);
            } finally {
                setIsLoading(false);
            }
        };
        loadFiles();
    }, []);

    const handleUpload = async (e) => {
        const uploadedFiles = Array.from(e.target.files);

        for (const file of uploadedFiles) {
            // Validate file size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                alert(`File ${file.name} is too large. Maximum size is 5MB.`);
                continue;
            }

            // Validate file type (allow images, pdf, doc/docx, txt)
            const allowedTypes = [
                'image/jpeg', 'image/png', 'image/gif',
                'application/pdf',
                'application/msword',
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'text/plain'
            ];

            if (!allowedTypes.includes(file.type)) {
                alert(`File ${file.name} has an unsupported file type.`);
                continue;
            }

            const reader = new FileReader();
            reader.onloadend = async () => {
                try {
                    const response = await filesAPI.upload({
                        name: file.name,
                        file_type: file.type,
                        file_url: reader.result, // Base64 encoded for now
                        file_size: file.size
                    });

                    setFiles((prev) => [...prev, {
                        file_id: response.data.file_id,
                        name: response.data.name,
                        file_type: response.data.file_type,
                        file_url: response.data.file_url,
                        created_at: response.data.created_at
                    }]);
                } catch (error) {
                    console.error("Error uploading file:", error);
                    alert("Failed to upload file. Please try again.");
                }
            };
            reader.readAsDataURL(file);
        }
    };

    // Helper to convert Base64 Data URL to Blob
    const dataURLtoBlob = (dataurl) => {
        if (!dataurl || !dataurl.includes(',')) return null;
        try {
            const arr = dataurl.split(',');
            const mime = arr[0].match(/:(.*?);/)[1];
            const bstr = atob(arr[1]);
            let n = bstr.length;
            const u8arr = new Uint8Array(n);
            while (n--) {
                u8arr[n] = bstr.charCodeAt(n);
            }
            return new Blob([u8arr], { type: mime });
        } catch (e) {
            console.error("Error converting data URL to blob:", e);
            return null;
        }
    };

    const handleView = (file) => {
        const blob = dataURLtoBlob(file.file_url);
        if (!blob) {
            alert("Could not open file. Invalid data.");
            return;
        }

        const blobUrl = URL.createObjectURL(blob);

        // Open in new tab
        const newWindow = window.open(blobUrl, '_blank');

        // Fallback if popup blocked
        if (!newWindow) {
            alert("Please allow popups to view files.");
        }

        // Clean up URL object after a delay
        setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
    };

    const deleteFile = async (id) => {
        try {
            await filesAPI.delete(id);
            setFiles((prev) => prev.filter((f) => f.file_id !== id));
        } catch (error) {
            console.error("Error deleting file:", error);
            alert("Failed to delete file. Please try again.");
        }
    };

    return (
        <div className="bookshelf-overlay">
            <div className="bookshelf-modal">

                <header>
                    <h2>📚 My Bookshelf</h2>
                    <button className="close-btn" onClick={onClose}>✕</button>
                </header>

                <label className="upload-btn">
                    Upload Files
                    <input
                        type="file"
                        multiple
                        accept=".pdf,image/*,.txt"
                        hidden
                        onChange={handleUpload}
                    />
                </label>

                <div className="file-grid">
                    {isLoading ? (
                        <p className="empty">Loading files...</p>
                    ) : files.length === 0 ? (
                        <p className="empty">No files yet. Upload to start reading 📖</p>
                    ) : (
                        files.map((file) => (
                            <div key={file.file_id} className="file-card">
                                <div
                                    className="file-preview"
                                    onClick={() => handleView(file)}
                                    title="Click to view"
                                    style={{ cursor: "pointer" }}
                                >
                                    {file.file_type?.startsWith('image/') ? (
                                        <img
                                            src={file.file_url}
                                            alt={file.name}
                                            className="file-thumb"
                                            style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px' }}
                                        />
                                    ) : (
                                        <span style={{ fontSize: '36px' }}>📄</span>
                                    )}
                                </div>

                                <div className="file-info">
                                    <span className="file-name">{file.name}</span>
                                    <span className="file-date">
                                        {file.created_at ? new Date(file.created_at).toLocaleDateString() : ''}
                                    </span>
                                </div>

                                <button
                                    className="delete-btn"
                                    onClick={() => deleteFile(file.file_id)}
                                >
                                    🗑️
                                </button>
                            </div>
                        ))
                    )}
                </div>

            </div>
        </div>
    );
};

export default BookshelfModal;
