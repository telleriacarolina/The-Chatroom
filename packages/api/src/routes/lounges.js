const express = require('express');
const router = express.Router();

// Simple in-memory lounge catalog per language
const LOUNGES_BY_LANGUAGE = {
  english: [
    { id: 'main', name: 'Main Hall', description: 'General discussion for everyone', memberCount: 1234, activeNow: 89, isPopular: true },
    { id: 'casual', name: 'Casual Chat', description: 'Relaxed conversations', memberCount: 856, activeNow: 45 },
    { id: 'gaming', name: 'Gaming', description: 'Talk about your favorite games', memberCount: 654, activeNow: 32 },
    { id: 'music', name: 'Music & Art', description: 'Share and discuss creative works', memberCount: 432, activeNow: 21 },
    { id: 'tech', name: 'Tech Talk', description: 'Technology and innovation', memberCount: 789, activeNow: 56, isPopular: true },
  ],
  spanish: [
    { id: 'principal', name: 'Sala Principal', description: 'Conversación general', memberCount: 712, activeNow: 34, isPopular: true },
    { id: 'juegos', name: 'Juegos', description: 'Videojuegos y más', memberCount: 402, activeNow: 19 },
  ],
  french: [
    { id: 'hall', name: 'Hall Principal', description: 'Discussions générales', memberCount: 389, activeNow: 22 },
  ],
  german: [
    { id: 'haupt', name: 'Hauptsaal', description: 'Allgemeine Diskussionen', memberCount: 301, activeNow: 17 },
  ],
  japanese: [
    { id: 'main', name: 'メインホール', description: 'みんなの雑談', memberCount: 520, activeNow: 28 },
  ],
  chinese: [
    { id: 'main', name: '主大厅', description: '综合讨论', memberCount: 615, activeNow: 41 },
  ],
  portuguese: [
    { id: 'principal', name: 'Sala Principal', description: 'Bate-papo geral', memberCount: 275, activeNow: 15 },
  ],
  arabic: [
    { id: 'main', name: 'القاعة الرئيسية', description: 'محادثات عامة', memberCount: 332, activeNow: 20 },
  ],
};

router.get('/', async (req, res) => {
  const language = String(req.query.language || '').toLowerCase();
  if (!language) return res.status(400).json({ error: 'language query param required' });

  const lounges = LOUNGES_BY_LANGUAGE[language] || LOUNGES_BY_LANGUAGE['english'] || [];
  return res.json({ language, lounges });
});

module.exports = router;