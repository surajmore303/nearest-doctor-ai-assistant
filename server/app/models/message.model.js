const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
    senderId:   { type: String, required: true },
    senderName: { type: String },
    doctorId:   { type: String, required: true },
    subject:    { type: String, default: 'General Inquiry' },
    body:       { type: String, required: true },
    read:       { type: Boolean, default: false },
    createdAt:  { type: Date, default: Date.now }
});

module.exports = mongoose.model('Message', MessageSchema);
