const Record = require('../models/Record.js');
const axios = require('axios');
const BLOCKCHAIN_API_URL = process.env.BLOCKCHAIN_NODE_URL || 'http://localhost:3001';

// Add new record
const record_Create_Post = async (req, res) => {
    try {
        const records = await Record.create(req.body);
        res.status(201).json({ Record: records });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: error.message });
    }
};

// Update record or create if not exists
const record_update = async (req, res) => {
    const id = req.params.id;
    const updateData = req.body.record || req.body;
    try {
        let record = await Record.findOneAndUpdate(
            { $or: [{ userid: id }, { "userid": { _id: id } }] },
            { $set: updateData },
            { new: true }
        );
        if (!record) {
            record = await Record.create({ userid: [id], ...updateData });
        }
        
        if (req.body.blockchainData) {
            try {
                await axios.post(`${BLOCKCHAIN_API_URL}/transaction/broadcast`, req.body.blockchainData);
                await axios.get(`${BLOCKCHAIN_API_URL}/mine`);
            } catch (err) {
                console.error("Blockchain error:", err.message);
            }
        }
        
        res.json(record);
    } catch (err) {
        console.error("Record update error:", err);
        res.status(500).json({ error: err.message });
    }
};

// Delete record
const record_delete = (req, res) => {
    const id = req.params.id;
    Record.findByIdAndDelete(id)
        .then(() => res.json({ msg: "Record deleted successfully" }))
        .catch((err) => res.status(500).json({ error: err.message }));
};

// Get single record details
const record_details = async (req, res) => {
    const id = req.params.id;
    try {
        let record = await Record.find({ $or: [{ userid: id }, { "userid": { _id: id } }] });
        if (!record || record.length === 0) {
            record = await Record.find({ _id: id });
        }
        res.json(record);
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: err.message });
    }
};

// Get all records list
const record_list = (req, res) => {
    Record.find()
        .populate('userid')
        .sort({ createdAt: -1 })
        .then((result) => res.json(result))
        .catch((err) => res.status(500).json({ error: err.message }));
};

module.exports = {
    record_Create_Post,
    record_delete,
    record_update,
    record_details,
    record_list
};