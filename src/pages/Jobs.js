import React, { useState,useEffect} from 'react';
import axios from 'axios';
import '../styles/Jobs.css';

import { useJobContext } from '../context/JobContext';

const Jobs = () => {
  const [jobDescription, setJobDescription] = useState(() => {
    return localStorage.getItem('jobDescription') || '';
  });

  const [cvFile, setCvFile] = useState(null);
  const [loadingFeedback, setLoadingFeedback] = useState(false);

  const [cvFileName, setCvFileName] = useState(() => {
    return localStorage.getItem('cvFileName') || '';
  });

  const [feedback, setFeedback] = useState(() => {
    const saved = localStorage.getItem('feedback');
    return saved ? JSON.parse(saved) : null;
  });

  const { setJobDescription: setGlobalJobDescription } = useJobContext();

  const handleJobDescriptionChange = (e) => {
    const value = e.target.value;
    setJobDescription(value);
    localStorage.setItem('jobDescription', value);
  };
  

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setCvFile(file);
    if (file) {
      localStorage.setItem('cvFileName', file.name);
      setCvFileName(file.name);
    }
  };
  const handleAnalyzeClick = async () => {
    if (!jobDescription || !cvFile) {
      alert('Please fill in both the job description and upload your CV.');
      return;
    }
  
    const formData = new FormData();
    formData.append('job_description', jobDescription);
    formData.append('cv', cvFile);
  
    for (let [key, value] of formData.entries()) {
      console.log(`${key}:`, value);
    }
  
    setLoadingFeedback(true); 
  
    try {
      const response = await axios.post('http://localhost:5000/analyze', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
  
      setFeedback(response.data.feedback);
      localStorage.setItem('feedback', JSON.stringify(response.data.feedback));
      setGlobalJobDescription(jobDescription);
    } catch (error) {
      console.error('There was an error!', error);
      alert('An error occurred while processing your request.');
    } finally {
      setLoadingFeedback(false); // Done loading
    }
  };
  useEffect(() => {
    const handleBeforeUnload = () => {
      localStorage.removeItem('feedback');
      localStorage.removeItem('jobDescription');
      localStorage.removeItem('cvFileName');
    
    };
  
    window.addEventListener('beforeunload', handleBeforeUnload);
  
    // Clean up the listener when the component unmounts
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);
  

  return (
    <div className='Jobs'>
      <div className='jobCards'>
        <div className='CV-card'>
          <label>Enter CV (must be in PDF form):</label>
          <input type='file' onChange={handleFileChange} />
          {cvFileName && <p>Selected File: {cvFileName}</p>}
        </div>

        <div className='description'>
          <label>Enter Job Description:</label>
          <textarea
            rows="7"
            value={jobDescription}
            onChange={handleJobDescriptionChange}
          />
        </div>

        <div className='btnSection'>
          <button onClick={handleAnalyzeClick}>Analyze</button>
        </div>
      </div>
      <div className="feedback">
      {loadingFeedback ? (
  <div className="dot-loader">
    <span></span><span></span><span></span>
  </div>
) : feedback && (
  
    <div className="Feedback">
      <h2>You have a {feedback.match_percentage}% match</h2>

      <div className="feedback-sections">
        <div>
          <h3>Similarities:</h3>
          <ul>
            {(feedback.similarities || []).map((item, idx) => (
              <li key={idx}>{item}</li>
            ))}
          </ul>
        </div>

        <div>
          <h3>What is missing from your CV:</h3>
          <ul>
            {(feedback.missing || []).map((item, idx) => (
              <li key={idx}>{item}</li>
            ))}
          </ul>
        </div>
      </div>

      <div className="courses">
        <h3>Recommended Courses to bridge the gap</h3>
        <ul>
          {(feedback.course_recommendations || []).map((item, idx) => (
            <li key={idx}>
              <a href={item.url} target="_blank" rel="noopener noreferrer">
                {item.name}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </div>

)}
</div>
    </div>
  );
};

export default Jobs;
