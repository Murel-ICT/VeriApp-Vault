const express = require('express');
const router = express.Router();

// Placeholder RFQ routes
router.get('/', (req, res) => {
    res.json({ success: true, message: 'RFQ routes coming soon' });
});

module.exports = router;