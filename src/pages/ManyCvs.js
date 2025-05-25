import React, { useState, useEffect } from 'react';
import '../styles/ManyCvs.css';

const ManyCvs = () => {
  const [selectedOptions, setSelectedOptions] = useState([]);

  const handleOptionChange = (e) => {
    const { value, checked } = e.target;

    if (value === "all") {
        setSelectedOptions(checked ? ["all"] : []);
        return;
    }

    let updated = [...selectedOptions].filter(opt => opt !== "all");

    if (checked) {
        if (updated.length >= 3) {
          alert("You can only select up to 3 options.");
          return;
        }
        updated.push(value);
      } else {
        updated = updated.filter(opt => opt !== value);
    }

      setSelectedOptions(updated);
    };

  
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
    formData.append('selectedOptions', JSON.stringify(selectedOptions)); 
  
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
      localStorage.setItem('analysisResultMany', JSON.stringify(result.results));
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
        <div className="parameters">
          <label>Choose parameters:</label>
          <div className="checkbox-group">
            <label>
              <input
                type="checkbox"
                value="all"
                checked={selectedOptions.includes("all")}
                onChange={handleOptionChange}
              />
              All
            </label>

            <label>
              <input
                type="checkbox"
                value="percentage"
                checked={selectedOptions.includes("percentage")}
                onChange={handleOptionChange}
                disabled={
                  selectedOptions.includes("all") || 
                  (!selectedOptions.includes("percentage") && selectedOptions.length >= 3)
                }
              />
              Percentage Match
            </label>

            <label>
              <input
                type="checkbox"
                value="similarities"
                checked={selectedOptions.includes("similarities")}
                onChange={handleOptionChange}
                disabled={
                  selectedOptions.includes("all") || 
                  (!selectedOptions.includes("similarities") && selectedOptions.length >= 3)
                }
              />
              Similarities
            </label>

            <label>
              <input
                type="checkbox"
                value="missing"
                checked={selectedOptions.includes("missing")}
                onChange={handleOptionChange}
                disabled={
                  selectedOptions.includes("all") || 
                  (!selectedOptions.includes("missing") && selectedOptions.length >= 3)
                }
              />
              Missing Skills
            </label>

            <label>
              <input
                type="checkbox"
                value="courses"
                checked={selectedOptions.includes("courses")}
                onChange={handleOptionChange}
                disabled={
                  selectedOptions.includes("all") || 
                  (!selectedOptions.includes("courses") && selectedOptions.length >= 3)
                }
              />
              Course Recommendations
            </label>
          </div>
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
                  {(selectedOptions.includes("percentage") || selectedOptions.includes("all")) && <th>Match %</th>}
                  {(selectedOptions.includes("similarities") || selectedOptions.includes("all")) && <th>Similar Skills</th>}
                  {(selectedOptions.includes("missing") || selectedOptions.includes("all")) && <th>Missing Skills</th>}
                  {(selectedOptions.includes("courses") || selectedOptions.includes("all")) && <th>Recommended Courses</th>}
                </tr>
              </thead>
              <tbody>
                {analysisResult.map(({ filename, feedback, error }) => (
                  <tr key={filename}>
                    <td>{filename}</td>
                    {error ? (
                      <td colSpan={
                        1 + 
                        (selectedOptions.includes("percentage") || selectedOptions.includes("all") ? 1 : 0) +
                        (selectedOptions.includes("similarities") || selectedOptions.includes("all") ? 1 : 0) +
                        (selectedOptions.includes("missing") || selectedOptions.includes("all") ? 1 : 0) +
                        (selectedOptions.includes("courses") || selectedOptions.includes("all") ? 1 : 0)
                      } style={{ color: 'red' }}>
                        Error: {error}
                      </td>
                    ) : (
                      <>
                        {(selectedOptions.includes("percentage") || selectedOptions.includes("all")) && (
                          <td>
                            {typeof feedback.match_percentage === 'number'
                              ? `${feedback.match_percentage}%`
                              : 'N/A'}
                          </td>
                        )}

                        {(selectedOptions.includes("similarities") || selectedOptions.includes("all")) && (
                          <td>
                            {Array.isArray(feedback.similarities) && feedback.similarities.length > 0
                              ? feedback.similarities.join(', ')
                              : 'None'}
                          </td>
                        )}

                        {(selectedOptions.includes("missing") || selectedOptions.includes("all")) && (
                          <td>
                            {Array.isArray(feedback.missing) && feedback.missing.length > 0
                              ? feedback.missing.join(', ')
                              : 'None'}
                          </td>
                        )}

                        {(selectedOptions.includes("courses") || selectedOptions.includes("all")) && (
                          <td>
                            {Array.isArray(feedback.course_recommendations) && feedback.course_recommendations.length > 0 ? (
                              <ul>
                                {feedback.course_recommendations.map((course) => (
                                  <li key={course.url}>
                                    <a href={course.url} target="_blank" rel="noopener noreferrer">{course.name}</a>
                                  </li>
                                ))}
                              </ul>
                            ) : 'None'}
                          </td>
                        )}
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
