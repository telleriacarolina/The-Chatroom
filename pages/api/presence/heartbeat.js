import { requireAuth } from '@/lib/middleware';
import { processHeartbeat } from '@/services/heartbeat';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  if (!requireAuth(req, res)) return; // responds 401

  const { stayOnline } = req.body || {};
  try {
    const user = req.user;
    const result = await processHeartbeat(user.id, !!stayOnline);
    res.json({ ok: true, presence: result });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
