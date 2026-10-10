// Free, no-token link checker. It never fetches user-supplied URLs, preventing SSRF.
const ADULT_DOMAINS = [
 'pornhub.com','xvideos.com','xnxx.com','xhamster.com','redtube.com','youporn.com',
 'tube8.com','spankbang.com','onlyfans.com','chaturbate.com','stripchat.com',
 'livejasmin.com','youjizz.com','hclips.com','sex.com','nhentai.net'
];
const ADULT_TERMS = ['porn','xxx','hentai','nsfw','adult-video'];
const DIRECT_EXTENSIONS = /\\.(mp4|webm|mov|m4v|mp3|m4a|aac|ogg|wav|flac|jpg|jpeg|png|gif|webp|pdf)(?:$|[?#])/i;
function hostMatches(host, domain) { return host === domain || host.endsWith('.' + domain); }
function privateHost(host) {
  const h = host.toLowerCase().replace(/^\\[|\\]$/g, '');
  if (h === 'localhost' || h.endsWith('.localhost') || h.endsWith('.local') || h === '::1') return true;
  if (/^(\\d{1,3}\\.){3}\\d{1,3}$/.test(h)) {
    const p = h.split('.').map(Number);
    if (p.some(n => n > 255)) return true;
    return p[0] === 10 || p[0] === 127 || p[0] === 0 || (p[0] === 169 && p[1] === 254) || (p[0] === 172 && p[1] >= 16 && p[1] <= 31) || (p[0] === 192 && p[1] === 168) || p[0] >= 224;
  }
  return false;
}
module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return res.status(405).json({ error: 'Method not allowed.' }); }
  const raw = req.body && typeof req.body === 'object' ? req.body.url : '';
  if (typeof raw !== 'string' || raw.length > 2048) return res.status(400).json({ error: 'Please provide a valid URL.' });
  let url;
  try { url = new URL(raw); } catch { return res.status(400).json({ error: 'That URL is not valid.' }); }
  if ((url.protocol !== 'https:' && url.protocol !== 'http:') || url.username || url.password || !url.hostname.includes('.') || privateHost(url.hostname)) return res.status(400).json({ error: 'Only normal public HTTP(S) URLs are allowed.' });
  const host = url.hostname.toLowerCase().replace(/^www\\./, '');
  const pathAndQuery = (url.pathname + url.search).toLowerCase();
  const configured = (process.env.BLOCKED_DOMAINS || '').split(',').map(s => s.trim().toLowerCase().replace(/^www\\./, '')).filter(Boolean);
  if (ADULT_DOMAINS.some(d => hostMatches(host, d)) || configured.some(d => hostMatches(host, d)) || ['.xxx','.porn','.sex'].some(t => host.endsWith(t)) || ADULT_TERMS.some(t => host.includes(t) || pathAndQuery.includes(t))) return res.status(403).json({ error: 'Blocked by Tempora safety rules.' });
  if (hostMatches(host, 'spotify.com') || hostMatches(host, 'anghami.com')) return res.status(200).json({ type: 'official-service', url: url.href, message: 'This is a music-streaming link. Tempora will not extract or bypass streaming protections; use the service’s official offline-download feature where available.' });
  if (DIRECT_EXTENSIONS.test(url.pathname + url.search)) {
    let fileName = url.pathname.split('/').pop() || '';
    try { fileName = decodeURIComponent(fileName); } catch {}
    return res.status(200).json({ type: 'direct-file', url: url.href, fileName: fileName.slice(0, 180), message: 'This looks like a direct media-file URL. Your browser or the file host controls whether it opens or downloads.' });
  }
  return res.status(200).json({ type: 'unsupported', url: url.href, message: 'This free version can open direct media-file links and recognize selected services, but it cannot extract media from every social or streaming page without a compatible backend. Try a direct file URL or the platform’s official download feature.' });
};
