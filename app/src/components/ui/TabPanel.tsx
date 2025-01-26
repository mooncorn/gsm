import React from 'react';

interface TabPanelProps {
  children: React.ReactNode;
  value: number;
  index: number;
}

const TabPanel = ({ children, value, index }: TabPanelProps) => {
  return (
    <div
      role="tabpanel"
      aria-hidden={value !== index}
      className={value === index ? 'block mt-4' : 'hidden'}
    >
      {children}
    </div>
  );
};

export default TabPanel; 