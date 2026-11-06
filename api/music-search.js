const API_URL = 'https://www.googleapis.com/youtube/v3/search';
const VIDEOS_URL = 'https://www.googleapis.com/youtube/v3/videos';

function durationSeconds(value = '') {
  const match = String(value).match(/^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/);
  return match ? Number(match[1] || 0) * 3600 + Number(match[2] || 0) * 60 + Number(match[3] || 0) : 0;
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Use GET to search for a song.' });
  }

  const query = String(req.query?.q || '').trim().slice(0, 100);
  const pageToken = String(req.query?.pageToken || '').slice(0, 512);
  if (query.length < 2) return res.status(400).json({ error: 'Enter at least two characters to search.' });

  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) return res.status(503).json({ error: 'Song search is not configured yet. Add YOUTUBE_API_KEY to the Vercel Production environment.' });

  try {
    const params = new URLSearchParams({
      part: 'snippet',
      q: query,
      type: 'video',
      videoCategoryId: '10',
      videoEmbeddable: 'true',
      maxResults: '8',
      safeSearch: 'moderate',
      key: apiKey,
    });
    if (pageToken) params.set('pageToken', pageToken);
    const response = await fetch(`${API_URL}?${params}`);
    const payload = await response.json();
    if (!response.ok) {
      console.error('YouTube song search failed:', payload?.error?.status || response.status);
      return res.status(response.status === 403 ? 503 : 502).json({ error: 'YouTube could not complete the search. Check the API key and its quota.' });
    }

    const items = payload.items || [];
    const ids = items.map(item => String(item?.id?.videoId || '')).filter(id => /^[A-Za-z0-9_-]{11}$/.test(id));
    const durationById = new Map();
    if (ids.length) {
      const detailsParams = new URLSearchParams({ part: 'contentDetails', id: ids.join(','), key: apiKey });
      const detailsResponse = await fetch(`${VIDEOS_URL}?${detailsParams}`);
      if (detailsResponse.ok) {
        const details = await detailsResponse.json();
        for (const item of details.items || []) durationById.set(item.id, durationSeconds(item.contentDetails?.duration));
      }
    }
    const results = items.flatMap(item => {
      const id = String(item?.id?.videoId || '');
      if (!/^[A-Za-z0-9_-]{11}$/.test(id)) return [];
      return [{
        id,
        title: String(item?.snippet?.title || 'Untitled song').slice(0, 160),
        channel: String(item?.snippet?.channelTitle || 'YouTube').slice(0, 100),
        thumbnail: String(item?.snippet?.thumbnails?.medium?.url || item?.snippet?.thumbnails?.default?.url || ''),
        duration: durationById.get(id) || 0,
        url: `https://www.youtube.com/watch?v=${id}`,
      }];
    });
    res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=300, stale-while-revalidate=600');
    return res.status(200).json({ results, nextPageToken: payload.nextPageToken || null });
  } catch (error) {
    console.error('YouTube song search request failed:', error?.message || error);
    return res.status(502).json({ error: 'Song search is temporarily unavailable. Try again in a moment.' });
  }
}
