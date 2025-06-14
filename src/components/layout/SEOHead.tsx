import React from 'react'
import Head from 'next/head'

interface SEOHeadProps {
  title?: string
  description?: string
  image?: string
  url?: string
  type?: 'website' | 'article' | 'profile'
  siteName?: string
}

export default function SEOHead({
  title = 'Sucia NYC - Event Management Platform',
  description = 'Real-time event management and guest experience platform for Sucia NYC',
  image = '/images/sucia-logo.png',
  url = 'https://sucianyc.com',
  type = 'website',
  siteName = 'Sucia NYC'
}: SEOHeadProps) {
  const fullTitle = title.includes('Sucia NYC') ? title : `${title} | Sucia NYC`
  
  return (
    <Head>
      {/* Basic Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      
      {/* Open Graph Meta Tags */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:url" content={url} />
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content={siteName} />
      <meta property="og:locale" content="en_US" />
      
      {/* Twitter Card Meta Tags */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
      <meta name="twitter:site" content="@sucianyc" />
      <meta name="twitter:creator" content="@sucianyc" />
      
      {/* Additional SEO Meta Tags */}
      <meta name="robots" content="index, follow" />
      <meta name="author" content="Sucia NYC" />
      <meta name="keywords" content="Sucia NYC, event management, guest experience, check-in, party planning, NYC events" />
      
      {/* Canonical URL */}
      <link rel="canonical" href={url} />
      
      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Organization",
            "name": "Sucia NYC",
            "description": description,
            "url": url,
            "logo": image,
            "sameAs": [
              "https://instagram.com/sucianyc",
              "https://twitter.com/sucianyc"
            ],
            "contactPoint": {
              "@type": "ContactPoint",
              "contactType": "customer service",
              "email": "hello@sucianyc.com"
            }
          })
        }}
      />
    </Head>
  )
} 