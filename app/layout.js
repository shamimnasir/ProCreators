import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from '@/components/ui/toaster'
import { ThemeProvider } from 'next-themes'
import { AuthProvider } from '@/contexts/AuthContext'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'ProCreators - AI-Powered Content Creation Platform',
  description: 'Create viral content, ebooks, videos, and more with AI',
  icons: {
    icon: '/favicon.svg',
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Google Fonts for Bangla/Bengali support */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Bengali:wght@400;500;600;700&display=swap" rel="stylesheet" />
        {/* Force light mode on initial load - clear any dark mode class immediately */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  // Remove dark class immediately
                  document.documentElement.classList.remove('dark');
                  document.documentElement.style.colorScheme = 'light';
                  // Clear any stored theme preference to force light mode
                  localStorage.removeItem('pubtools-theme');
                  localStorage.removeItem('theme');
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className={inter.className} suppressHydrationWarning>
        <ThemeProvider 
          attribute="class" 
          defaultTheme="light"
          forcedTheme={undefined}
          enableSystem={false}
          storageKey="pubtools-theme"
          disableTransitionOnChange
        >
          <AuthProvider>
            {children}
            <Toaster />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
