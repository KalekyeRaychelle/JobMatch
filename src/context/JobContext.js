import React, { createContext, useState, useContext } from 'react';

// Create the context
const JobContext = createContext();

// Custom hook to use the JobContext
export const useJobContext = () => {
  return useContext(JobContext);
};

// JobContext Provider component to wrap your app
export const JobProvider = ({ children }) => {
  const [jobDescription, setJobDescription] = useState('');

  return (
    <JobContext.Provider value={{ jobDescription, setJobDescription }}>
      {children}
    </JobContext.Provider>
  );
};
