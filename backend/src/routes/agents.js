const express = require('express');
const router = express.Router();

// Placeholder agent routes
router.get('/', (req, res) => {
    res.json({ success: true, message: 'Agent routes coming soon' });
});

module.exports = router;