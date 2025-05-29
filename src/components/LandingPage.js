import React, { useEffect, useState } from 'react';
import '../styles/LandingPage.css';
import canvasDots from './canvasDots';
import { useNavigate } from 'react-router-dom';

const LandingPage = () => {
  const [role, setRole] = useState('');
  const navigate = useNavigate();
  const text = 'Job Match';

  useEffect(() => {
    canvasDots();
  }, []);

  useEffect(() => {
    if (role === 'recruiter') {
      navigate('/ManyCvs'); 
    }
  }, [role, navigate]);

  return (
    <div className="LandingPage">
      <canvas className="canvas-2"></canvas>

      <div className="topSide">
        <p className="nextHeading">
          {' '}
          <span className="text">
            {text.split('').map((char, index) => (
              <span
                key={index}
                className="letter"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {char === ' ' ? '\u00A0' : char}
              </span>
            ))}
          </span>
        </p>
        <div className="roleSelect">
          <button
            className={`roleBtn ${role === 'student' ? 'active' : ''}`}
            onClick={() => setRole('student')}
          >
            I’m a Student
          </button>
          <button
            className={`roleBtn ${role === 'recruiter' ? 'active' : ''}`}
            onClick={() => setRole('recruiter')}
          >
            I’m a Recruiter
          </button>
        </div>

        {role === 'student' && (
          <div className="studentOptions">
            <button onClick={() => navigate('/ChatPrep')} className="actionBtn">Quick Chat Prep</button>
            <button onClick={() => navigate('/SingleCv')} className="actionBtn">Single CV Analysis</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default LandingPage;
