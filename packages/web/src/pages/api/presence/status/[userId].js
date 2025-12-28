import { getUserPresence } from '@/services/heartbeat';

export default async function handler(req, res) {
  const { userId } = req.query;
  if (req.method !== 'GET') return res.status(405).end();
  try {
    const presence = await getUserPresence(userId);
    res.json({ ok: true, presence });
  } catch (e) {
    res.status(404).json({ error: e.message });
  }
}
