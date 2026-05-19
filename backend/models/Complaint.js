const mongoose = require('mongoose');

const ComplaintSchema = new mongoose.Schema({
    name: String,
    email: String,
    title: {
        type: String,
        required: [true, 'Please add a complaint title']
    },
    description: {
        type: String,
        required: [true, 'Please add a description']
    },
    category: {
        type: String,
        required: [true, 'Please select a category']
    },
    location: {
        type: String,
        required: [true, 'Please add a location']
    },
    status: {
        type: String,
        default: "Pending",
        enum: ['Pending', 'In Progress', 'Resolved', 'Rejected']
    },
    priority: {
        type: String,
        default: "Medium"
    },
    department: {
        type: String
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Complaint', ComplaintSchema);
