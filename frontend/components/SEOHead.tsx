import Head from 'next/head'

interface SEOHeadProps {
  title?: string
  description?: string
  keywords?: string
  image?: string
  url?: string
  type?: 'website' | 'article'
}

export default function SEOHead({
  title = 'Reword - Repurpose your content for X, Linkedin and many more !',
  description = 'Turn your blogs, articles, and newsletters into engaging X threads, LinkedIn posts, and Instagram carousels with AI. Join 5,000+ creators growing their audience.',
  keywords = 'content repurposing, social media automation, AI content creation, Twitter threads, LinkedIn posts, Instagram carousels, content marketing, social media tools',
  image = '/og-image.png',
  url = 'https://reword.entrext.com',
  type = 'website'
}: SEOHeadProps) {
  const fullTitle = title.includes('Reword') ? title : `${title} | Reword`
  const fullUrl = url.startsWith('http') ? url : `https://reword.entrext.com${url}`
  const fullImage = image.startsWith('http') ? image : `https://reword.entrext.com${image}`

  return (
    <Head>
      {/* Basic Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <meta name="author" content="Reword" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta name="robots" content="index, follow" />
      <link rel="canonical" href={fullUrl} />

      {/* Open Graph Tags */}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={fullImage} />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:site_name" content="Reword" />

      {/* Twitter Card Tags */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={fullImage} />
      <meta name="twitter:creator" content="@rewordapp" />

      {/* Additional Meta Tags */}
      <meta name="theme-color" content="#3b82f6" />
      <meta name="msapplication-TileColor" content="#3b82f6" />

      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebApplication",
            "name": "Reword",
            "description": description,
            "url": fullUrl,
            "applicationCategory": "BusinessApplication",
            "operatingSystem": "Web",
            "offers": {
              "@type": "Offer",
              "price": "0",
              "priceCurrency": "USD"
            },
            "creator": {
              "@type": "Organization",
              "name": "Reword",
              "url": "https://reword.entrext.com"
            }
          })
        }}
      />
    </Head>
  )
}