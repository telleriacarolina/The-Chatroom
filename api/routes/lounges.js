// Lounge routes
const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');

// Mock lounge data
const lounges = [
  {
    id: '1',
    name: 'English Lounge',
    language: 'en',
    memberCount: 42,
    countries: ['US', 'UK', 'CA', 'AU']
  },
  {
    id: '2',
    name: 'Spanish Lounge',
    language: 'es',
    memberCount: 38,
    countries: ['ES', 'MX', 'AR', 'CO']
  },
  {
    id: '3',
    name: 'French Lounge',
    language: 'fr',
    memberCount: 25,
    countries: ['FR', 'BE', 'CH', 'CA']
  }
];

router.get('/', (req, res) => {
  try {
    res.json({ lounges });
  } catch (e) {
    logger.error('Error fetching lounges:', e);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/:id', (req, res) => {
  try {
    const lounge = lounges.find(l => l.id === req.params.id);
    if (!lounge) return res.status(404).json({ error: 'Lounge not found' });
    res.json(lounge);
  } catch (e) {
    logger.error('Error fetching lounge:', e);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
