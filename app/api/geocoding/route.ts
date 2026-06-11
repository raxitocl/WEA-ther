import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');

  if (!query || query.trim().length === 0) {
    return NextResponse.json({ results: [] });
  }

  try {
    // We request results in Spanish (es) for user familiarity, fallback to english or default values
    const response = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=10&language=es&format=json`,
      {
        headers: {
          'Accept': 'application/json',
        },
        next: { revalidate: 3600 } // Cache searches for 1 hour
      }
    );

    if (!response.ok) {
      throw new Error(`Geocoding API responded with status ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Geocoding error:', error);
    return NextResponse.json({ error: error.message || 'Failed to search cities' }, { status: 500 });
  }
}
