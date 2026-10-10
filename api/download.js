const SUPPORTED_HOSTS = [
  'tiktok.com','youtube.com','youtu.be','instagram.com','x.com','twitter.com',
  'threads.net','bilibili.com','xiaohongshu.com','xhslink.com','douyin.com',
  'kuaishou.com','kwai.com','weibo.com','toutiao.com'
];
const UNSUPPORTED_MUSIC_HOSTS = ['spotify.com','soundcloud.com','anghami.com'];
const SUSPICIOUS_TLDS = ['.xxx','.porn','.sex'];
const SUSPICIOUS_TERMS = ['porn','xxx','adult','nsfw','hentai'];
function hostIs(host, domain) { return host === domain || host.endsWith('.' + domain); }
function blocked(url) {
  const host = url.hostname.toLowerCase().replace(/^www\./, '');
  const pathAndQuery = (url.pathname + url.search).toLowerCase();
  if (SUSPICIOUS_TLDS.some(tld => host.endsWith(tld))) return 'This link is blocked by Tempora safety rules.';
  if (SUSPICIOUS_TERMS.some(term => pathAndQuery.includes(term))) return 'This link is blocked by Tempora safety rules.';
  const configured = (process.env.BLOCKED_DOMAINS || '').split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
  if (configured.some(domain => hostIs(host, domain.replace(/^www\./, '')))) return 'This domain is blocked by Tempora safety rules.';
  if (UNSUPPORTED_MUSIC_HOSTS.some(domain => hostIs(host, domain))) return 'Music streaming links are not supported by this downloader.';
  if (!SUPPORTED_HOSTS.some(domain => hostIs(host, domain))) return 'This platform is not supported. Use a public post link from a supported social platform.';
  return null;
}
module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed.' });
  }
  const token = process.env.EASYDOWN_API_TOKEN;
  if (!token) return res.status(503).json({ error: 'Downloader is not configured yet. The site owner must add EASYDOWN_API_TOKEN in Vercel environment variables.' });
  const raw = req.body && typeof req.body === 'object' ? req.body.url : '';
  if (typeof raw !== 'string' || raw.length > 2048) return res.status(400).json({ error: 'Please provide a valid URL.' });
  let url;
  try { url = new URL(raw); } catch { return res.status(400).json({ error: 'That URL is not valid.' }); }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') return res.status(400).json({ error: 'Only HTTP(S) links are accepted.' });
  if (url.username || url.password || !url.hostname.includes('.')) return res.status(400).json({ error: 'Please use a normal public post URL.' });
  const blockReason = blocked(url);
  if (blockReason) return res.status(403).json({ error: blockReason });
  try {
    const upstream = await fetch('https://api.easydown.org/api/v1/parse', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ url: url.href })
    });
    const payload = await upstream.json().catch(() => ({}));
    if (!upstream.ok) return res.status(upstream.status === 401 ? 502 : 422).json({ error: payload.message || payload.error || 'The provider could not process this link.' });
    return res.status(200).json(payload);
  } catch (e) {
    return res.status(502).json({ error: 'The downloader provider is temporarily unavailable. Try again later.' });
  }
};
