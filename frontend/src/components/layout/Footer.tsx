import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-white border-t border-gray-200 py-6">
      <div className="container mx-auto px-4">
        <div className="text-center text-gray-500 text-sm">
          <p>© {new Date().getFullYear()} AI Trip Planner. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};
