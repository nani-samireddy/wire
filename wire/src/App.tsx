import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';

// Import page components
import { useMeetingStore } from './store/useMeetingStore.tsx';
import HomePage from './pages/HomePage.tsx';
import MeetingRoom from './pages/MeetingRoom.tsx';


function AppContent() {
  const navigate = useNavigate();
  // Get the initSocket action from the store
  const initSocket = useMeetingStore((state) => state.initSocket);

  // Initialize socket connection when AppContent mounts
  // This will ensure the socket is set up and listeners are active
  useEffect(() => {
    // Pass navigate function to initSocket so store can handle navigation on disconnect/not found
    initSocket(navigate);

    }, [initSocket, navigate]);

  return (
    <div className="min-h-screen font-inter">
      <Routes>
        <Route path="/" element={<HomePage />} />
        {/* <Route path="/pre-join" element={<PreJoinScreen />} /> */}
        <Route path="/meeting" element={<MeetingRoom />} />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
