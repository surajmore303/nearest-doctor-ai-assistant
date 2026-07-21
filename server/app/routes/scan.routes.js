const express = require('express');
const router = express.Router();
const Scan = require('../models/scan.model');

// Save scan result
router.post('/save', async (req, res) => {
    try {
        const scan = await Scan.create(req.body);
        res.status(201).json(scan);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get all scans by doctor
router.get('/doctor/:doctorId', async (req, res) => {
    try {
        const scans = await Scan.find({ doctorId: req.params.doctorId }).sort({ createdAt: -1 });
        res.json(scans);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get all scans (admin/records)
router.get('/', async (req, res) => {
    try {
        const scans = await Scan.find().sort({ createdAt: -1 });
        res.json(scans);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
