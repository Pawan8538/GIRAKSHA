import { Inter, JetBrains_Mono } from 'next/font/google';
import { AuthProvider } from '../hooks/useAuth';
import '../styles/globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-primary',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata = {
  title: 'गिरAKSHA - Advanced Mine Safety',
  description: 'AI-powered mine safety monitoring system',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`} suppressHydrationWarning={true}>
      <body className="min-h-screen bg-gray-50" suppressHydrationWarning={true}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
