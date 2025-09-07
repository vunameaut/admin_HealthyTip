import React from 'react';
import DashboardLayout from './DashboardLayout';

interface LayoutWrapperProps {
  children: React.ReactNode;
}

export default function LayoutWrapper({ children }: LayoutWrapperProps) {
  return (
    <DashboardLayout>
      {children}
    </DashboardLayout>
  );
}
