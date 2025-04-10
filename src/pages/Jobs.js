import React, { useState } from 'react';
import axios from 'axios';
import '../styles/Jobs.css';

import { useJobContext } from '../context/JobContext';

const Jobs = () => {
  const [jobDescription, setJobDescription] = useState('');
  const [cvFile, setCvFile] = useState(null);

  const [feedback, setFeedback] = useState(null);
  const { setJobDescription: setGlobalJobDescription } = useJobContext(); 
  const handleJobDescriptionChange = (e) => {
    setJobDescription(e.target.value);
  };

  const handleFileChange = (e) => {
    setCvFile(e.target.files[0]);
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
  
    try {
      const response = await axios.post('http://localhost:5000/analyze', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setFeedback(response.data.feedback);
      setGlobalJobDescription(jobDescription);
    } catch (error) {
      console.error('There was an error!', error);
      alert('An error occurred while processing your request.');
    }
  };return (
    <div className='Jobs'>
      <div className='jobCards'>
        <div className='CV-card'>
          <label>Enter CV (must be in PDF form):</label>
          <input type='file' onChange={handleFileChange} />
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
  
      {feedback && (
        <div className="feedback">
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
        </div>
      )}
    </div>
  );
}
export default Jobs;