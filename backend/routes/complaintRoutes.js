const express = require('express');
const router = express.Router();
const {
    addComplaint,
    getComplaints,
    updateComplaintStatus,
    searchComplaints,
    getComplaintStats
} = require('../controllers/complaintController');
const { protect } = require('../middleware/authMiddleware');

router.route('/')
    .post(protect, addComplaint)
    .get(protect, getComplaints);

router.route('/stats')
    .get(protect, getComplaintStats);

router.route('/search')
    .get(protect, searchComplaints);

router.route('/:id')
    .put(protect, updateComplaintStatus);

module.exports = router;
