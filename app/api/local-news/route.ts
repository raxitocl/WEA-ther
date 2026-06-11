import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export const dynamic = 'force-dynamic';

const settingsPath = path.join(process.cwd(), 'settings.json');

const COUNTRY_CODES: Record<string, string> = {
  'chile': 'CL',
  'argentina': 'AR',
  'peru': 'PE',
  'perú': 'PE',
  'bolivia': 'BO',
  'colombia': 'CO',
  'venezuela': 'VE',
  'ecuador': 'EC',
  'paraguay': 'PY',
  'uruguay': 'UY',
  'mexico': 'MX',
  'méxico': 'MX',
  'panama': 'PA',
  'panamá': 'PA',
  'nicaragua': 'NI',
  'costa rica': 'CR',
  'honduras': 'HN',
  'el salvador': 'SV',
  'guatemala': 'GT',
  'cuba': 'CU',
  'puerto rico': 'PR',
  'españa': 'ES',
  'espana': 'ES',
  'eeuu': 'US',
  'usa': 'US',
  'estados unidos': 'US',
};

interface RssFeed {
  id: string;
  name: string;
  url: string;
  enabled: boolean;
  isBuiltIn?: boolean;
  isScraper?: boolean;
}

function getSoyChileSlug(city: string): string | null {
  const normalized = city
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove accents
    .trim();

  const mapping: Record<string, string> = {
    'arica': 'arica',
    'iquique': 'iquique',
    'calama': 'calama',
    'antofagasta': 'antofagasta',
    'copiapo': 'copiapo',
    'valparaiso': 'valparaiso',
    'quillota': 'quillota',
    'san antonio': 'san-antonio',
    'san-antonio': 'san-antonio',
    'chillan': 'chillan',
    'san carlos': 'san-carlos',
    'san-carlos': 'san-carlos',
    'talcahuano': 'talcahuano',
    'concepcion': 'concepcion',
    'coronel': 'coronel',
    'arauco': 'arauco',
    'temuco': 'temuco',
    'valdivia': 'valdivia',
    'osorno': 'osorno',
    'puerto montt': 'puerto-montt',
    'puerto-montt': 'puerto-montt',
    'puertomontt': 'puerto-montt',
    'chiloe': 'chiloe',
    'santiago': 'santiago'
  };

  return mapping[normalized] || null;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const city = searchParams.get('city') || '';
    const country = searchParams.get('country') || '';

    if (!city && !country) {
      return NextResponse.json({ news: [] });
    }

    // Determine country code
    const normalizedCountry = country.toLowerCase().trim();
    const gl = COUNTRY_CODES[normalizedCountry] || 'CL';
    const isChile = gl === 'CL' || normalizedCountry === 'chile';

    const refresh = searchParams.get('refresh') === 'true';
    const fetchOptions: RequestInit = refresh
      ? { cache: 'no-store' }
      : { next: { revalidate: 900 } };



    // 1. Read settings.json to get custom RSS feeds
    let rssFeeds: RssFeed[] = [];
    let includeCountryNews = true;
    let settings: any = null;
    try {
      const settingsData = await fs.readFile(settingsPath, 'utf8');
      settings = JSON.parse(settingsData);
      rssFeeds = settings.rssFeeds || [];
      includeCountryNews = settings.includeCountryNews !== false;
    } catch (e) {
      console.warn("Failed to read settings.json for RSS feeds:", e);
    }

    // Check if news provider is Gemini Scraper
    const newsProvider = settings?.providers?.news;
    if (newsProvider && newsProvider.type === 'gemini-scraper' && newsProvider.url) {
      try {
        const { callGeminiRaw, scrapeAndCleanHtml } = require('../gemini/route');
        console.log(`Scraping news from: ${newsProvider.url}`);
        const html = await scrapeAndCleanHtml(newsProvider.url, newsProvider.cssSelector);
        
        const defaultPrompt = 
          "Extrae las últimas noticias o titulares de la página web provista. " +
          "Devuelve un JSON estructurado de la siguiente forma: " +
          "{\n" +
          "  \"news\": [\n" +
          "    { \"text\": \"Titular de la noticia 1\", \"tag\": \"Fuente o Categoría\" },\n" +
          "    { \"text\": \"Titular de la noticia 2\", \"tag\": \"Fuente o Categoría\" }\n" +
          "  ]\n" +
          "}";
        
        const prompt = newsProvider.prompt || defaultPrompt;
        const result = await callGeminiRaw(prompt, html);
        
        if (result && Array.isArray(result.news)) {
          const mappedNews = result.news.map((item: any) => ({
            text: (item.text || '').toUpperCase(),
            tag: (item.tag || 'ALERTA IA').toUpperCase()
          }));
          return NextResponse.json({ news: mappedNews.slice(0, 50) });
        }
      } catch (err: any) {
        console.error('Failed to scrape news using Gemini Scraper:', err);
      }
    }

    // Default built-in feeds if none configured in settings
    if (rssFeeds.length === 0) {
      rssFeeds = [
        {
          id: 'google-news',
          name: 'Google News (Búsqueda Automática)',
          url: 'https://news.google.com/rss/search?q=Noticias+{ciudad}+{pais}&hl=es-419&gl=CL&ceid=CL:es-419',
          enabled: true,
          isBuiltIn: true
        },
        {
          id: 'soychile',
          name: 'SoyChile (Portal Regional)',
          url: 'https://www.soychile.cl/{ciudad}/',
          enabled: true,
          isBuiltIn: true,
          isScraper: true
        }
      ];
    }

    const allNews: Array<{ text: string, tag: string }> = [];
    const seenTitles = new Set<string>();

    // Process all enabled feeds
    for (const feed of rssFeeds) {
      if (!feed.enabled) continue;

      if (feed.id === 'soychile' || feed.isScraper) {
        if (isChile && city) {
          const slug = getSoyChileSlug(city);
          if (slug) {
            try {
              const soychileUrl = `https://www.soychile.cl/${slug}/`;
              const response = await fetch(soychileUrl, {
                ...fetchOptions,
                headers: {
                  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                }
              });
              if (response.ok) {
                const html = await response.text();
                // Match links ending in .html
                const linkRegex = new RegExp(`<a\\s+[^>]*href="\\/${slug}\\/[^"]+?\\.html"[^>]*>([\\s\\S]+?)<\\/a>`, 'gi');
                const matches = html.matchAll(linkRegex);

                for (const match of matches) {
                  let title = match[1]
                    .replace(/<[^>]+>/g, '') // strip internal tags
                    .replace(/&amp;/g, '&')
                    .replace(/&lt;/g, '<')
                    .replace(/&gt;/g, '>')
                    .replace(/&quot;/g, '"')
                    .replace(/&#39;/g, "'")
                    .replace(/&apos;/g, "'")
                    .replace(/\s+/g, ' ')
                    .trim();

                  if (title.length > 10) {
                    const lowerTitle = title.toLowerCase();
                    if (lowerTitle !== 'soychile' && lowerTitle !== `soy${slug}`) {
                      const cleanTitle = title.toUpperCase();
                      if (!seenTitles.has(cleanTitle)) {
                        seenTitles.add(cleanTitle);
                        allNews.push({
                          text: title,
                          tag: `LOCAL: SOY${slug.toUpperCase()}`
                        });
                      }
                    }
                  }
                }
              }
            } catch (err) {
              console.error(`Error processing SoyChile feed:`, err);
            }
          }
        }
      } else if (feed.id === 'google-news') {
        const queriesToFetch: string[] = [];
        if (city) {
          queriesToFetch.push(`Noticias ${city}`);
        } else if (country) {
          queriesToFetch.push(`Noticias ${country}`);
        }

        if (includeCountryNews && city && country) {
          queriesToFetch.push(`Noticias ${country}`);
        }

        for (const query of queriesToFetch) {
          try {
            const googleUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=es-419&gl=${gl}&ceid=${gl}:es-419`;
            const res = await fetch(googleUrl, fetchOptions);
            if (res.ok) {
              const xmlText = await res.text();
              const itemMatches = xmlText.matchAll(/<item>([\s\S]*?)<\/item>/g);
              for (const match of itemMatches) {
                const itemContent = match[1];
                const titleMatch = itemContent.match(/<title>([\s\S]*?)<\/title>/);
                if (titleMatch) {
                  let rawTitle = titleMatch[1];
                  rawTitle = rawTitle.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1');
                  rawTitle = rawTitle
                    .replace(/&amp;/g, '&')
                    .replace(/&lt;/g, '<')
                    .replace(/&gt;/g, '>')
                    .replace(/&quot;/g, '"')
                    .replace(/&#39;/g, "'")
                    .replace(/&apos;/g, "'");

                  const lastDashIndex = rawTitle.lastIndexOf(' - ');
                  let title = rawTitle;
                  if (lastDashIndex !== -1) {
                    title = rawTitle.substring(0, lastDashIndex).trim();
                  }

                  const cleanTitle = title.toUpperCase();
                  if (title.length > 10 && !seenTitles.has(cleanTitle)) {
                    seenTitles.add(cleanTitle);
                    let tag = 'NOTICIA';
                    if (city && query.includes(city)) {
                      tag = `LOCAL: ${city.toUpperCase()}`;
                    } else if (country && query.includes(country)) {
                      tag = country.toUpperCase();
                    }
                    allNews.push({
                      text: title,
                      tag
                    });
                  }
                }
              }
            }
          } catch (err) {
            console.error(`Error processing Google News query (${query}):`, err);
          }
        }
      } else {
        // Custom RSS Feed
        try {
          const formattedUrl = feed.url
            .replace(/{ciudad}/g, city)
            .replace(/{pais}/g, country);

          const res = await fetch(formattedUrl, fetchOptions);
          if (res.ok) {
            const xmlText = await res.text();
            const itemMatches = xmlText.matchAll(/<item>([\s\S]*?)<\/item>/g);
            for (const match of itemMatches) {
              const itemContent = match[1];
              const titleMatch = itemContent.match(/<title>([\s\S]*?)<\/title>/);
              if (titleMatch) {
                let rawTitle = titleMatch[1];
                rawTitle = rawTitle.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1');
                rawTitle = rawTitle
                  .replace(/&amp;/g, '&')
                  .replace(/&lt;/g, '<')
                  .replace(/&gt;/g, '>')
                  .replace(/&quot;/g, '"')
                  .replace(/&#39;/g, "'")
                  .replace(/&apos;/g, "'");

                const lastDashIndex = rawTitle.lastIndexOf(' - ');
                let title = rawTitle;
                if (lastDashIndex !== -1) {
                  title = rawTitle.substring(0, lastDashIndex).trim();
                }

                const cleanTitle = title.toUpperCase();
                if (title.length > 10 && !seenTitles.has(cleanTitle)) {
                  seenTitles.add(cleanTitle);
                  allNews.push({
                    text: title,
                    tag: feed.name.toUpperCase()
                  });
                }
              }
            }
          }
        } catch (err) {
          console.error(`Error processing custom RSS feed (${feed.name}):`, err);
        }
      }
    }

    // Return the top 50 news items to make the ticker longer (above 30, up to 50)
    return NextResponse.json({ news: allNews.slice(0, 50) });
  } catch (error: any) {
    console.error('Error fetching local news:', error);
    return NextResponse.json({ error: error.message || 'Error fetching news' }, { status: 500 });
  }
}
