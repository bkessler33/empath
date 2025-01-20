import React from 'react';
import { createRoot } from 'react-dom/client';
import { DeviceFrame } from './components/DeviceFrame';
import './styles/global.css';

const App = () => {
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <DeviceFrame />
    </div>
  );
};

// Wait for the DOM to be ready
document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('root');
  if (!container) {
    throw new Error('Root element not found');
  }
  const root = createRoot(container);
  root.render(<App />);
});