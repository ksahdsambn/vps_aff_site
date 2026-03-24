import React from 'react';

interface VpsProgressProps {
  value: number;
  max: number;
  color?: string;
}

const VpsProgress: React.FC<VpsProgressProps> = ({ value, max, color = '#6366f1' }) => {
  const percentage = Math.min((value / max) * 100, 100);
  
  return (
    <div className="vps-progress-container">
      <div 
        className="vps-progress-bar" 
        style={{ 
          width: `${percentage}%`, 
          background: color,
          boxShadow: `0 0 8px ${color}40`
        }} 
      />
    </div>
  );
};

export default VpsProgress;
