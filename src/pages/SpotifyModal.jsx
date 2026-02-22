const CLIENT_ID = "YOUR_SPOTIFY_CLIENT_ID";
const REDIRECT_URI = "http://localhost:5173/spotify-callback";
const SCOPES = [
  "user-read-private",
  "user-read-email",
  "streaming",
  "user-read-playback-state",
  "user-modify-playback-state"
];

const SpotifyModal = ({ onClose }) => {
  const loginSpotify = () => {
    const authUrl =
      "https://accounts.spotify.com/authorize" +
      "?response_type=code" +
      "&client_id=" + CLIENT_ID +
      "&scope=" + encodeURIComponent(SCOPES.join(" ")) +
      "&redirect_uri=" + encodeURIComponent(REDIRECT_URI);

    window.location.href = authUrl;
  };

  return (
    <div className="spotify-overlay">
      <div className="spotify-modal">
        <h2>🎧 Connect Spotify</h2>
        <p>
          Login to Spotify to listen to your playlists while studying.
        </p>

        <button className="spotify-btn" onClick={loginSpotify}>
          Login with Spotify
        </button>

        <button className="close-btn" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
};

export default SpotifyModal;
