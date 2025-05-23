import React, { useState, useEffect } from 'react';
import '../styles/ManyCvs.css';

const ManyCvs = () => {
  const [files, setFiles] = useState(() => {
    const stored = localStorage.getItem('cvFiles');
    return stored ? JSON.parse(stored) : [];
  });
  
  const [jobDescription, setJobDescription] = useState(() => {
    return localStorage.getItem('jobDescriptionMany') || '';
  });
  
  const [analysisResult, setAnalysisResult] = useState(() => {
    const stored = localStorage.getItem('analysisResultMany');
    return stored ? JSON.parse(stored) : null;
  });
  
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    const handleBeforeUnload = () => {
      localStorage.removeItem('jobDescriptionMany');
      localStorage.removeItem('cvFiles');
      localStorage.removeItem('analysisResultMany'); // clear stored feedback
    };
  
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);
  
  const handleAnalyze = async () => {
    if (!jobDescription || files.length === 0) {
      alert('Please provide a job description and at least one CV file.');
      return;
    }
  
    const formData = new FormData();
    formData.append('jobDescription', jobDescription);
    files.forEach((file) => formData.append('cvs', file));
  
    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/analyzeManyCvs', {
        method: 'POST',
        body: formData,
      });
  
      if (!response.ok) {
        throw new Error('Failed to analyze CVs');
      }
  
      const result = await response.json();
      setAnalysisResult(result.results);
      localStorage.setItem('analysisResultMany', JSON.stringify(result.results)); // Save to localStorage
    } catch (error) {
      console.error('Error analyzing CVs:', error.message);
      alert('Something went wrong while analyzing CVs.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleFileChange = (e) => {
    const newFiles = Array.from(e.target.files);
    const updated = [...files, ...newFiles];
    const unique = Array.from(new Map(updated.map(f => [f.name, f])).values());
    setFiles(unique);
    localStorage.setItem('cvFiles', JSON.stringify(unique.map(file => ({ name: file.name }))));
  };
  
  const removeFile = (name) => {
    const updated = files.filter(file => file.name !== name);
    setFiles(updated);
    localStorage.setItem('cvFiles', JSON.stringify(updated.map(file => ({ name: file.name }))));
  };
  
  const handleDescriptionChange = (e) => {
    const value = e.target.value;
    setJobDescription(value);
    localStorage.setItem('jobDescriptionMany', value);
  };
  
  return (
    <div className="ManyCvs">
      <div className="jobCards">
        <div className="description">
          <label>Enter Job Description:</label>
          <textarea
            rows="7"
            value={jobDescription}
            onChange={handleDescriptionChange}
          />
        </div>

        <div className="CV-card">
          <label>Upload CVs (PDFs only):</label>
          <input type="file" multiple onChange={handleFileChange} />
          {files.length > 0 && (
            <ul>
              {files.map((file, index) => (
                <li key={index}>
                  {file.name}
                  <button className="removeBtn" onClick={() => removeFile(file.name)}>Remove</button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="btnSection">
          <button onClick={handleAnalyze}>Analyze</button>
        </div>

        {loading ? (
          <div className="dot-loader">
            <span></span><span></span><span></span>
          </div>
        ) : analysisResult && analysisResult.length > 0 && (
          <div className="results">
            <h3>Analysis Summary</h3>
            <div className="table-container">
              <table className="feedback-table">
                <thead>
                  <tr>
                    <th>CV Name</th>
                    <th>Match %</th>
                    <th>Similar Skills</th>
                    <th>Missing Skills</th>
                    <th>Recommended Courses</th>
                  </tr>
                </thead>
                <tbody>
                  {analysisResult.map(({ filename, feedback, error }) => (
                    <tr key={filename}>
                      <td>{filename}</td>
                      {error ? (
                        <td colSpan="4" style={{ color: 'red' }}>Error: {error}</td>
                      ) : (
                        <>
                          <td>{feedback.match_percentage}%</td>
                          <td>{feedback.similarities.length > 0 ? feedback.similarities.join(', ') : 'None'}</td>
                          <td>{feedback.missing.length > 0 ? feedback.missing.join(', ') : 'None'}</td>
                          <td>
                            {feedback.course_recommendations.length > 0 ? (
                              <ul>
                                {feedback.course_recommendations.map(course => (
                                  <li key={course.url}>
                                    <a href={course.url} target="_blank" rel="noopener noreferrer">{course.name}</a>
                                  </li>
                                ))}
                              </ul>
                            ) : 'None'}
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManyCvs;
