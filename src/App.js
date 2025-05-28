import React from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import ChatPrep from "./pages/ChatPrep";
import Header from "./components/Header";
import Heading from './components/Heading';
import Jobs from "./pages/Jobs";
import { JobProvider } from "./context/JobContext";
import PrepHeading from "./components/PrepHeading";
import ManyCvs from './pages/ManyCvs';


function App() {
  const location = useLocation(); 

  return (
    <div className="App">
      <Header />

      {(location.pathname === '/' || location.pathname === '/ManyCvs') && <Heading />}
      {location.pathname === '/ChatPrep' && <PrepHeading />}

      <JobProvider>
        <Routes>
          <Route path="/" element={<Jobs />} />
          <Route path="/ChatPrep" element={<ChatPrep />} />
          <Route path="/ManyCvs" element={<ManyCvs />} />
          
        </Routes>
      </JobProvider>
    </div>
  );
}

export default App;
