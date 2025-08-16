// api/update-config.js
// ENV cần có: GITHUB_TOKEN, GITHUB_REPO (vd: thanhnha245/ThanhNha.245), GITHUB_BRANCH (vd: main), GITHUB_FILE_PATH (vd: bio-config.json)
// Dùng được trên Vercel (Node 18+ có fetch sẵn). Netlify Function cũng tương tự.

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).send('Method Not Allowed');
    return;
  }
  try {
    const { config, message } = req.body || {};
    if (!config) {
      res.status(400).send('Missing config');
      return;
    }

    const token  = process.env.GITHUB_TOKEN;
    const repo   = process.env.GITHUB_REPO;
    const branch = process.env.GITHUB_BRANCH || 'main';
    const path   = process.env.GITHUB_FILE_PATH || 'bio-config.json';

    if (!token || !repo) {
      res.status(500).send('Server missing env: GITHUB_TOKEN/GITHUB_REPO');
      return;
    }

    const headers = { Authorization: `token ${token}`, 'User-Agent': 'bio-admin' };
    const base = `https://api.github.com/repos/${repo}/contents/${encodeURIComponent(path)}`;

    // Lấy SHA file hiện tại (nếu có)
    let sha;
    const get = await fetch(`${base}?ref=${encodeURIComponent(branch)}`, { headers });
    if (get.ok) {
      const data = await get.json();
      sha = data.sha;
    } else if (get.status !== 404) {
      res.status(get.status).send(await get.text());
      return;
    }

    // PUT nội dung mới (base64)
    const put = await fetch(base, {
      method: 'PUT',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: message || 'Update bio-config.json',
        content: Buffer.from(JSON.stringify(config, null, 2), 'utf8').toString('base64'),
        sha,
        branch
      })
    });

    if (!put.ok) {
      res.status(put.status).send(await put.text());
      return;
    }
    res.status(200).json({ ok: true });
  } catch (e) {
    res.status(500).send(e?.message || 'Server error');
  }
}
