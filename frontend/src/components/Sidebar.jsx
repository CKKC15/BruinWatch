import React from "react";
import { FaPlus, FaBook, FaStickyNote, FaUserCircle } from "react-icons/fa";
import "./Sidebar.css";

export default function Sidebar({ onUpload, onCreateClass, onNavigate }) {
  return (
    <div className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo">BruinWatch</div>

      {/* Upload dropdown */}
      <div className="sidebar-icon" onClick={onUpload}>
        <FaPlus />
        <span>Upload Lecture</span>
      </div>

      {/* My Classes */}
      <div className="sidebar-icon" onClick={() => onNavigate("classes")}>
        <FaBook />
        <span>My Classes</span>
      </div>

      {/* Notes */}
      <div className="sidebar-icon" onClick={() => onNavigate("notes")}>
        <FaStickyNote />
        <span>Notes</span>
      </div>

      {/* Profile at bottom */}
      <div className="sidebar-profile">
        <FaUserCircle size={28} />
      </div>
    </div>
  );
}

