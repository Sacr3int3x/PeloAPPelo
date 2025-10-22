import React, { useEffect, useState } from 'react';
import { MdBlock } from 'react-icons/md';
import './BlockAlert.css';

function BlockAlert({ message, duration = 5000 }) {
  const [show, setShow] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShow(false);
    }, duration);

    return () => clearTimeout(timer);
  }, [duration]);

  if (!show) return null;

  return (
    <div className="block-alert">
      <MdBlock size={24} className="block-alert-icon" aria-hidden="true" />
      <div className="block-alert-content">
        {message}
      </div>
    </div>
  );
}

export default BlockAlert;