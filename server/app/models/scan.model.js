const mongoose = require('mongoose');

const ScanSchema = new mongoose.Schema({
    doctorId:   { type: String, required: true },
    doctorName: { type: String },
    bodyPart:   { type: String, required: true },
    findings:   { type: [String], default: [] },
    diagnosis:  { type: String, required: true },
    severity:   { type: String, enum: ['Normal', 'Mild', 'Moderate', 'Severe'], default: 'Normal' },
    notes:      { type: String, default: '' },
    imageBase64:{ type: String },
    createdAt:  { type: Date, default: Date.now }
});

module.exports = mongoose.model('Scan', ScanSchema);
