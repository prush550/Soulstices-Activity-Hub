const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

const groupsPath = path.join(__dirname, '../data/groups.json');

// Get all groups
router.get('/', (req, res) => {
  try {
    const data = fs.readFileSync(groupsPath, 'utf8');
    const groups = JSON.parse(data);
    res.json(groups);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch groups' });
  }
});

// Get group by ID
router.get('/:id', (req, res) => {
  try {
    const data = fs.readFileSync(groupsPath, 'utf8');
    const groups = JSON.parse(data);
    const group = groups.find(g => g.id === req.params.id);
    
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }
    
    res.json(group);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch group' });
  }
});

module.exports = router;