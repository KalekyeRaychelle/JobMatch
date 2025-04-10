import React, { useState,useEffect } from 'react';
import Prompt from '../components/Prompt';
import '../styles/ChatPrep.css';

import { useJobContext } from '../context/JobContext';

const ChatPrep = () => {
  const [qaList, setQaList] = useState([]);
  
  const { jobDescription } = useJobContext();
  const [questions, setQuestions] = useState([]);
  const handleSubmit = async (question) => {
    setQaList([...qaList, { question, answer: '...' }]);

    try {
      const response = await fetch('http://localhost:5000/Ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question }),
      });

      const data = await response.json();

      setQaList((prev) =>
        prev.map((qa, i) =>
          i === prev.length - 1 ? { ...qa, answer: data.answer } : qa
        )
      );
    } catch (err) {
      console.error(err);
      setQaList((prev) =>
        prev.map((qa, i) =>
          i === prev.length - 1
            ? { ...qa, answer: 'Something went wrong. Try again.' }
            : qa
        )
      );
    }
  };
  
  useEffect(() => {
    const fetchQuestions = async () => {
      if (!jobDescription) return;

      try {
        const res = await fetch('http://localhost:5000/get-questions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ job_description: jobDescription }),
        });

        const data = await res.json();
        setQuestions(data.questions);
      } catch (err) {
        console.error(err);
      }
    };

    fetchQuestions();
  }, [jobDescription]);

  

  return (
   <div className='ChatPrep'>
     <div className="questions">
        <h2>TEN QUESTIONS TO BE ASKED</h2>
        {questions.length > 0 ? (
          <ul>
            {questions.map((qa, index) => (
              <li key={index} className="qa-item">
                <h3>Q: {qa.question}</h3>
                <p>A: {qa.answer}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p>No questions available.</p>
        )}
      </div>
     <div className="chatprep-container">
      <h2 className="chatprep-header">Interview Helper Agent</h2>

      <div className="chatprep-body">
        {qaList.map((item, idx) => (
          <div key={idx} className="qa-item">
            <p><strong>Q:</strong> {item.question}</p>
            <p><strong>A:</strong> {item.answer}</p>
          </div>
        ))}
      </div>

      <Prompt onSubmit={handleSubmit} />
    </div>
   </div>
  );
};

export default ChatPrep;
