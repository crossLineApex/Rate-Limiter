const express = require('express');
const router = express.Router();
const rateLimiter = require('../middlewares/rateLimiter.js');

router.get('/data', rateLimiter, (req,res) => {
    res.json({
        success: true,
        message: 'Request successful',
    });
})

module.exports = router;