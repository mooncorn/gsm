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
      hidden={value !== index}
      className={`${value === index ? 'block' : 'hidden'} mt-4`}
    >
      {children}
    </div>
  );
};

export default TabPanel; 