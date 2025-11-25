import { MetadataRoute } from 'next';
import itemsData from '../data/items_database.json';
import itemsRelationData from '../data/items_relation.json';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const currentDate = new Date();

  // Base routes
  const routes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: currentDate,
      changeFrequency: 'daily',
      priority: 1.0,
    },
  ];

  // Add crafting tree routes for items with relationships
  const craftingTreeRoutes = (itemsRelationData as any[])
    .filter((item) => item.edges && item.edges.length > 0)
    .map((item) => ({
      url: `${baseUrl}/crafting-tree?item=${encodeURIComponent(item.name)}`,
      lastModified: currentDate,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }));

  routes.push(...craftingTreeRoutes);

  return routes;
}

