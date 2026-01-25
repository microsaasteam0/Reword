import { Inter, Plus_Jakarta_Sans } from 'next/font/google'
import { Metadata } from 'next'
import './globals.css'
import ClientProviders from '../components/ClientProviders'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-plus-jakarta',
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NODE_ENV === 'production'
    ? 'https://reword.app'
    : 'http://localhost:3000'
  ),
  title: {
    default: 'Reword - AI Content Repurposing Tool for X, LinkedIn & Instagram',
    template: '%s | Reword'
  },
  description: 'Reword is the ultimate AI content repurposing tool for creators and marketers. Automate the transformation of blogs, articles, and newsletters into platform-optimized social media posts for X (Twitter), LinkedIn, and Instagram in seconds.',
  keywords: ['AI content repurposing', 'content repurposing tool', 'social media automation', 'blog to twitter thread', 'newsletter to linkedin post', 'instagram carousel generator', 'AI writing assistant', 'content strategy', 'Reword AI'],
  authors: [{ name: 'Entrext Labs', url: 'https://entrext.in' }],
  creator: 'Entrext Labs',
  publisher: 'Entrext Labs',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: '/',
    siteName: 'Reword',
    title: 'Reword - AI Content Repurposing Tool for X, LinkedIn & Instagram',
    description: 'Automate the transformation of blogs, articles, and newsletters into platform-optimized social media posts for X, LinkedIn, and Instagram in seconds.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Reword - AI Content Transformation',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Reword - AI Content Repurposing Tool for X, LinkedIn & Instagram',
    description: 'Automate the transformation of blogs, articles, and newsletters into platform-optimized social media posts for X, LinkedIn, and Instagram in seconds.',
    creator: '@entrextlabs',
    images: ['/twitter-image.png'],
  },
  alternates: {
    canonical: '/',
  },
  icons: {
    icon: '/logo.png',
    shortcut: '/logo.png',
    apple: '/logo.png',
  },
  manifest: '/site.webmanifest',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* CRITICAL: Theme Script - Must be first to prevent flash */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                function setTheme() {
                  try {
                    var theme = localStorage.getItem('reword-theme') || 'dark';
                    var resolvedTheme = theme;
                    
                    if (theme === 'system') {
                      resolvedTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                    }
                    
                    var root = document.documentElement;
                    
                    // Remove any existing theme classes
                    root.classList.remove('light', 'dark', 'theme-loaded');
                    
                    if (resolvedTheme === 'dark') {
                      root.classList.add('dark');
                      root.style.colorScheme = 'dark';
                      root.style.setProperty('--bg-color', '#111827');
                      root.style.setProperty('--text-color', '#ffffff');
                    } else {
                      root.style.colorScheme = 'light';
                      root.style.setProperty('--bg-color', '#f9fafb');
                      root.style.setProperty('--text-color', '#111827');
                    }
                    
                    // Update theme-color meta tag
                    var metaThemeColor = document.querySelector('meta[name="theme-color"]');
                    if (metaThemeColor) {
                      metaThemeColor.setAttribute('content', resolvedTheme === 'dark' ? '#111827' : '#ffffff');
                    }
                    
                    // Enable transitions after a brief delay
                    setTimeout(function() {
                      root.classList.add('theme-loaded');
                    }, 50);
                  } catch (e) {
                    // Fallback to dark theme
                    var root = document.documentElement;
                    root.classList.add('dark');
                    root.style.colorScheme = 'dark';
                    root.style.setProperty('--bg-color', '#111827');
                    root.style.setProperty('--text-color', '#ffffff');
                    setTimeout(function() {
                      root.classList.add('theme-loaded');
                    }, 50);
                  }
                }
                
                // Set theme immediately
                setTheme();
                
                // Set theme again when DOM is ready (double insurance)
                if (document.readyState === 'loading') {
                  document.addEventListener('DOMContentLoaded', setTheme);
                } else {
                  setTheme();
                }
              })();
            `
          }}
        />

        {/* Preconnect to external domains for performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className={`${inter.variable} ${plusJakarta.variable} font-sans`}>
        {/* Structured Data for SEO/AI-SEO/AEO */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              "name": "Reword",
              "alternateName": "Reword AI",
              "description": "Reword is an AI-powered content repurposing tool that transforms blogs, articles, and newsletters into platform-optimized social media posts for X (Twitter), LinkedIn, and Instagram.",
              "url": "https://reword.app",
              "applicationCategory": "BusinessApplication, MultimediaApplication",
              "operatingSystem": "Web, Windows, macOS, Linux, Android, iOS",
              "keywords": "AI content repurposing, social media automation, blog to twitter thread, newsletter to linkedin post, content transformation tool, AI writing assistant",
              "offers": {
                "@type": "AggregateOffer",
                "priceCurrency": "USD",
                "lowPrice": "0",
                "highPrice": "15.00",
                "offerCount": "2",
                "offers": [
                  {
                    "@type": "Offer",
                    "name": "Free Plan",
                    "price": "0",
                    "priceCurrency": "USD"
                  },
                  {
                    "@type": "Offer",
                    "name": "Pro Plan",
                    "price": "15.00",
                    "priceCurrency": "USD"
                  }
                ]
              },
              "creator": {
                "@type": "Organization",
                "name": "Entrext Labs",
                "url": "https://entrext.in",
                "logo": "https://reword.app/logo.png"
              },
              "featureList": [
                "Blog-to-Social Transformation",
                "Twitter Thread Generation",
                "LinkedIn Post Optimization",
                "Instagram Carousel Content Creation",
                "Custom Content Templates",
                "Advanced AI Usage Statistics"
              ],
              "screenshot": "https://reword.app/og-image.png",
              "softwareVersion": "1.0.0"
            })
          }}
        />

        <ClientProviders>
          {children}
        </ClientProviders>
      </body>
    </html>
  )
}