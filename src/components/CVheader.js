import React from 'react'
import { Link } from 'react-router-dom';
const CVheader = () => {
  return (
    <div>
      <header className="app-header">
      
      <ul>
        <li><Link to='/'>Home</Link></li>
      </ul>
    <h1>JobMatch</h1>
  </header>
    </div>
  )
}

export default CVheader;
