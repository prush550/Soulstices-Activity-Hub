const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

const activitiesPath = path.join(__dirname, '../data/activities.json');

// Get all activities
router.get('/', (req, res) => {
  try {
    const data = fs.readFileSync(activitiesPath, 'utf8');
    const activities = JSON.parse(data);
    res.json(activities);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch activities' });
  }
});

// Get activity by ID
router.get('/:id', (req, res) => {
  try {
    const data = fs.readFileSync(activitiesPath, 'utf8');
    const activities = JSON.parse(data);
    const activity = activities.find(a => a.id === req.params.id);
    
    if (!activity) {
      return res.status(404).json({ error: 'Activity not found' });
    }
    
    res.json(activity);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch activity' });
  }
});

// Get activities by date range
router.get('/filter/date', (req, res) => {
  try {
    const { start, end } = req.query;
    const data = fs.readFileSync(activitiesPath, 'utf8');
    const activities = JSON.parse(data);
    
    let filtered = activities;
    
    if (start) {
      filtered = filtered.filter(a => new Date(a.date) >= new Date(start));
    }
    
    if (end) {
      filtered = filtered.filter(a => new Date(a.date) <= new Date(end));
    }
    
    res.json(filtered);
  } catch (error) {
    res.status(500).json({ error: 'Failed to filter activities' });
  }
});

module.exports = router;