const express = require('express');
const router = express.Router();
const Message = require('../models/message.model');
const User = require('../models/user.model');

// POST /messages/send — patient sends message to doctor
router.post('/send', async (req, res) => {
    try {
        const { senderId, senderName, doctorId, subject, body } = req.body;
        if (!senderId || !doctorId || !body) return res.status(400).json({ error: 'Missing required fields' });
        const msg = await Message.create({ senderId, senderName, doctorId, subject, body });
        res.status(201).json(msg);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /messages/doctor/:doctorId — doctor fetches all messages sent to them
router.get('/doctor/:doctorId', async (req, res) => {
    try {
        const messages = await Message.find({ doctorId: req.params.doctorId }).sort({ createdAt: -1 });
        res.json(messages);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PATCH /messages/read/:id — mark message as read
router.patch('/read/:id', async (req, res) => {
    try {
        const msg = await Message.findByIdAndUpdate(req.params.id, { read: true }, { new: true });
        res.json(msg);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /messages/unread-count/:doctorId — unread badge count
router.get('/unread-count/:doctorId', async (req, res) => {
    try {
        const count = await Message.countDocuments({ doctorId: req.params.doctorId, read: false });
        res.json({ count });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
