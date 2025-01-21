import React from 'react';
import { createRoot } from 'react-dom/client';
import DeviceFrame from './components/DeviceFrame/index'; 
import './global.css';

const container = document.getElementById('root');
if (!container) {
    throw new Error('Failed to find the root element');
}

const root = createRoot(container);
root.render(
    <React.StrictMode>
        <div className="min-h-screen bg-transparent">
            <DeviceFrame />
        </div>
    </React.StrictMode>
);