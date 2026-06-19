import React from 'react';
import { createRoot } from 'react-dom/client';
import { MenuIcon } from '@animateicons/react/lucide';

const container = document.getElementById('menuToggleIcon');
if (container) {
  const root = createRoot(container);
  root.render(
    React.createElement(MenuIcon, {
      size: 24,
      duration: 1,
      color: '#0f172a',
    })
  );
}
