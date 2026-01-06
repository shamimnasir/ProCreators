import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from '@/components/ui/toaster'
import { ThemeProvider } from 'next-themes'

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
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
