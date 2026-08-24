import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const text = (req.query.text as string) || '';
  if (!text.trim()) {
    return res.status(400).send('Missing text parameter');
  }

  const googleUrl = `https://translate.google.com/translate_tts?ie=UTF-8&tl=ja&client=tw-ob&q=${encodeURIComponent(text.trim())}`;

  try {
    const response = await fetch(googleUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
      }
    });

    if (!response.ok) {
      return res.status(response.status).send('TTS upstream fetch error');
    }

    const arrayBuffer = await response.arrayBuffer();
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Cache-Control', 'public, max-age=604800, s-maxage=604800'); // Cache for 7 days
    return res.status(200).send(Buffer.from(arrayBuffer));
  } catch (error: any) {
    return res.status(500).send(error.message);
  }
}
