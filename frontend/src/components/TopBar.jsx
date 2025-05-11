import React from 'react':
import {FaSearch} from 'react-icons/fa';

export default function TopBar(props) {
  function handleInputChange(event) {
    const userInput = event.target.value;
    props.onSearch(userInput);
  }
  return(
    <div className="topbar-wrapper">
      <div className = "topbar-search">
        <FaSearch className ="topbar-icon" />
        <input
          type = "text"
          placeholder="Search lectures..."
          classname="topbar-input"
          onChange={handleInputChange}
          />
        </div>
      </div>
    );
}
