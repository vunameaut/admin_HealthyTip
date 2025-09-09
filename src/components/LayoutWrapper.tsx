import React from 'react';
import DashboardLayout from './DashboardLayout';

interface LayoutWrapperProps {
  children: React.ReactNode;
  darkMode?: boolean;
  toggleDarkMode?: () => void;
}

export default function LayoutWrapper({ 
  children, 
  darkMode, 
  toggleDarkMode 
}: LayoutWrapperProps) {
  return (
    <DashboardLayout darkMode={darkMode} toggleDarkMode={toggleDarkMode}>
      {children}
    </DashboardLayout>
  );
}
