import { AuthProvider } from '../hooks/useAuth';
import '../styles/globals.css';

export const metadata = {
  title: 'गिरAKSHA - Advanced Mine Safety',
  description: 'AI-powered mine safety monitoring system',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning={true}>
      <body className="min-h-screen bg-gray-50 font-sans" suppressHydrationWarning={true}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
