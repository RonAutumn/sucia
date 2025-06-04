import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import EventPicker from './components/EventPicker';
import GuestList from './components/GuestList';
import AdminReset from './components/AdminReset';
import OfflineBanner from './components/OfflineBanner';
import NetworkStatusIndicator from './components/NetworkStatusIndicator';
import { useOnlineStatus } from './hooks/useOnlineStatus';

function App() {
  const isOnline = useOnlineStatus();

  return (
    <Router>
      <div className="App">
        {/* Offline Banner - sticky at top */}
        <OfflineBanner isVisible={!isOnline} />
        
        {/* Network Status Indicator - positioned in top-right corner */}
        <div className="fixed top-4 right-4 z-40">
          <NetworkStatusIndicator
            isOnline={isOnline}
            showLabel={true}
            size="sm"
            className="bg-white px-2 py-1 rounded-md shadow-md border"
          />
        </div>
        
        {/* Main content with offset when offline banner is shown */}
        <div className={`transition-all duration-300 ${!isOnline ? 'pt-14' : ''}`}>
          <Routes>
            <Route path="/" element={<EventPicker />} />
            <Route path="/event/:id" element={<GuestList />} />
            <Route path="/admin" element={<AdminReset />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App; 