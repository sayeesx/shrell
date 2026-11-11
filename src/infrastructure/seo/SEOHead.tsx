import React from 'react';
import { Helmet } from 'react-helmet-async';
import { SITE_URL, ensureAbsoluteImageUrl } from './schemaGenerators';

export interface SEOHeadProps {
  title: string;
  description: string;
  canonicalPath?: string;
  canonicalUrl?: string;
  ogType?: 'website' | 'product' | 'article';
  ogImage?: string;
  ogImageAlt?: string;
  twitterCard?: 'summary_large_image' | 'summary';
  noIndex?: boolean;
  structuredData?: Record<string, any> | Array<Record<string, any>>;
}

export const SEOHead: React.FC<SEOHeadProps> = ({
  title,
  description,
  canonicalPath,
  canonicalUrl,
  ogType = 'website',
  ogImage = '/shrell-opengraph.png',
  ogImageAlt = 'SHRELL Automotive - Premium Car Accessories India',
  twitterCard = 'summary_large_image',
  noIndex = false,
  structuredData,
}) => {
  // Resolve absolute canonical URL
  const resolvedCanonical = canonicalUrl
    ? canonicalUrl
    : canonicalPath
    ? `${SITE_URL}${canonicalPath.startsWith('/') ? '' : '/'}${canonicalPath}`
    : SITE_URL;

  const absoluteOgImage = ensureAbsoluteImageUrl(ogImage);

  return (
    <Helmet>
      {/* Primary HTML Meta Tags */}
      <title>{title}</title>
      <meta name="title" content={title} />
      <meta name="description" content={description} />
      <link rel="canonical" href={resolvedCanonical} />

      {/* Robots Directive */}
      {noIndex ? (
        <meta name="robots" content="noindex, nofollow" />
      ) : (
        <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1" />
      )}

      {/* Open Graph / Facebook / WhatsApp */}
      <meta property="og:type" content={ogType} />
      <meta property="og:site_name" content="SHRELL Automotive" />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={resolvedCanonical} />
      <meta property="og:image" content={absoluteOgImage} />
      <meta property="og:image:secure_url" content={absoluteOgImage} />
      <meta property="og:image:alt" content={ogImageAlt} />

      {/* Twitter Cards */}
      <meta name="twitter:card" content={twitterCard} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={absoluteOgImage} />
      <meta name="twitter:image:alt" content={ogImageAlt} />

      {/* Structured Data (JSON-LD) */}
      {structuredData && (
        <script type="application/ld+json">
          {JSON.stringify(
            Array.isArray(structuredData)
              ? structuredData
              : [structuredData]
          )}
        </script>
      )}
    </Helmet>
  );
};

