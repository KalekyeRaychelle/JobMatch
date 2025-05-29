import React from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import ChatPrep from "./pages/ChatPrep";
import Header from "./components/Header";
import Heading from './components/Heading';
import Jobs from "./pages/Jobs";
import { JobProvider } from "./context/JobContext";
import PrepHeading from "./components/PrepHeading";
import ManyCvs from './pages/ManyCvs';
import LandingPage from './components/LandingPage';
function App() {
  const location = useLocation();

  const showHeader = location.pathname !== '/'; // Hide Header on LandingPage

  return (
    <div className="App">
      {showHeader && <Header />}

      {(location.pathname === '/SingleCv') && <Heading />}
      {location.pathname === '/ChatPrep' && <PrepHeading />}

      <JobProvider>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/ChatPrep" element={<ChatPrep />} />
          <Route path="/ManyCvs" element={<ManyCvs />} />
          <Route path="/SingleCv" element={<Jobs />} />
        </Routes>
      </JobProvider>
    </div>
  );
}

export default App;
