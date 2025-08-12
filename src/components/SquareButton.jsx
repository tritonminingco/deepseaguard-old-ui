    // SquareButton.js
    import React from 'react';
    import '../styles/SquareButton.css'; // For styling

    const SquareButton = ({ label, onClick }) => {
      return (
        <button className="square-button" onClick={onClick}>
          {label}
        </button>
      );
    };

    export default SquareButton;