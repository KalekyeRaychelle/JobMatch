import React, { useState, useEffect } from 'react';
import '../styles/TwoCvs.css';

const TwoCvs = () => {
  const [description, setDescription] = useState(() => {
    return localStorage.getItem('jobDescriptionTwo') || '';
  });

  const [files, setFiles] = useState(() => {
    const stored = localStorage.getItem('cvFilesTwo');
    return stored ? JSON.parse(stored) : Array(5).fill(null);
  });

  const [analysisResult, setAnalysisResult] = useState(() => {
    const stored = localStorage.getItem('analysisResultTwo');
    return stored ? JSON.parse(stored) : null;
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const handleBeforeUnload = () => {
      localStorage.removeItem('jobDescriptionTwo');
      localStorage.removeItem('cvFilesTwo');
      localStorage.removeItem('analysisResultTwo');
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  const handleFileChange = (index, event) => {
    const selectedFile = event.target.files[0];
    if (!selectedFile) return;

    const updated = [...files];
    updated[index] = selectedFile;

    setFiles(updated);
    localStorage.setItem('cvFilesTwo', JSON.stringify(updated.map(f => f ? { name: f.name } : null)));
  };

  const handleSubmit = async () => {
    if (!description || files.every(f => !f)) {
      alert('Please enter a job description and upload at least one CV.');
      return;
    }

    const formData = new FormData();
    formData.append('jobDescription', description);
    files.forEach(file => {
      if (file) formData.append('cvs', file);
    });

    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/analyzeManyCvs', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) throw new Error('Failed to analyze CVs');

      const result = await response.json();
      setAnalysisResult(result.results);
      localStorage.setItem('analysisResultTwo', JSON.stringify(result.results));
    } catch (error) {
      console.error('Upload error:', error);
      alert('Something went wrong while analyzing CVs.');
    } finally {
      setLoading(false);
    }
  };

  const handleDescriptionChange = (e) => {
    setDescription(e.target.value);
    localStorage.setItem('jobDescriptionTwo', e.target.value);
  };

  return (
    <div className='TwoCvs'>
      <div className="jobCards">
        <div className='description'>
          <label>Enter Job Description:</label>
          <textarea
            rows="7"
            value={description}
            onChange={handleDescriptionChange}
          />
        </div>

        <div className='Cv-container'>
          {files.map((file, index) => (
            <div className='CV-cards' key={index}>
              <label>Enter CV (PDF only):</label>
              <input
                type='file'
                accept="application/pdf"
                onChange={e => handleFileChange(index, e)}
              />
              {file && <p className="filename">{file.name}</p>}
            </div>
          ))}
        </div>

        <div className='btnSection'>
          <button onClick={handleSubmit}>Analyze</button>
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
                        <td colSpan="4">Error: {error}</td>
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

export default TwoCvs;
