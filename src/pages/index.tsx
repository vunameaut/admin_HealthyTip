import { useEffect } from 'react';
import { useRouter } from 'next/router';
import LoginPage from '@/components/LoginPage';

interface IndexPageProps {
  darkMode: boolean;
  toggleDarkMode: () => void;
}

export default function IndexPage({ darkMode, toggleDarkMode }: IndexPageProps) {
  const router = useRouter();

  useEffect(() => {
    // Redirect to login if not authenticated
    // This will be handled by the LoginPage component
  }, []);

  return <LoginPage darkMode={darkMode} toggleDarkMode={toggleDarkMode} />;
}
