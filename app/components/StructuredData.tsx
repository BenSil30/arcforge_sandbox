import Script from 'next/script';

interface StructuredDataProps {
  type: 'WebSite' | 'ItemList' | 'WebPage';
  data: any;
}

export default function StructuredData({ type, data }: StructuredDataProps) {
  let structuredData: any = {
    '@context': 'https://schema.org',
  };

  switch (type) {
    case 'WebSite':
      structuredData = {
        ...structuredData,
        '@type': 'WebSite',
        name: data.name || 'ARC Forge',
        description: data.description,
        url: data.url,
        potentialAction: {
          '@type': 'SearchAction',
          target: {
            '@type': 'EntryPoint',
            urlTemplate: `${data.url}?search={search_term_string}`,
          },
          'query-input': 'required name=search_term_string',
        },
      };
      break;

    case 'ItemList':
      structuredData = {
        ...structuredData,
        '@type': 'ItemList',
        name: data.name,
        description: data.description,
        numberOfItems: data.numberOfItems,
        itemListElement: data.items?.map((item: any, index: number) => ({
          '@type': 'ListItem',
          position: index + 1,
          item: {
            '@type': 'Product',
            name: item.name,
            description: item.description,
            image: item.image,
            url: item.url,
          },
        })),
      };
      break;

    case 'WebPage':
      structuredData = {
        ...structuredData,
        '@type': 'WebPage',
        name: data.name,
        description: data.description,
        url: data.url,
      };
      break;
  }

  return (
    <Script
      id={`structured-data-${type}`}
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      strategy="beforeInteractive"
    />
  );
}

