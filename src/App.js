import React from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import ChatPrep from "./pages/ChatPrep";
import Header from "./components/Header";
import CVheader from './components/CVheader';
import Heading from './components/Heading';
import Jobs from "./pages/Jobs";
import { JobProvider } from "./context/JobContext";
import PrepHeading from "./components/PrepHeading";
import ManyCvs from './pages/ManyCvs';
import LandingPage from './components/LandingPage';

function App() {
  const location = useLocation();

  const path = location.pathname;

  const showHeader = path === '/SingleCv' || path === '/ChatPrep';
  const showCVHeader = path === '/ManyCvs';

  return (
    <div className="App">
      {showHeader && <Header />}
      {showCVHeader && <CVheader />}
      
      {(path === '/SingleCv' || path === '/ManyCvs') && <Heading />}
      {path === '/ChatPrep' && <PrepHeading />}

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