const express = require('express');
const cors = require('cors');
const activitiesRouter = require('./routes/activities');
const groupsRouter = require('./routes/groups');

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/activities', activitiesRouter);
app.use('/api/groups', groupsRouter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Soulstices Activity Hub API is running' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Soulstices Activity Hub Backend running on http://localhost:${PORT}`);
  console.log(`📍 Serving Bhopal, Madhya Pradesh`);
});