import React, { useState, useEffect } from 'react';
import '../styles/TwoCvs.css';

const TwoCvs = () => {
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
  
    formData.append('selectedParameters', JSON.stringify(selectedOptions));
  
   
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
                        1 + // CV Name
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

export default TwoCvs;
