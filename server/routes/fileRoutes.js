const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const fileController = require('../controllers/fileController');

// Route to get a file (redirects to signed URL)
// Allow public access without protect so PDFs can be downloaded by anyone if needed?
// Wait, the prompt says "confirm a signed URL scoped to one user's certificate can't be reused to reach another user's file".
// This implies protection. I'll add `protect`.
router.get('/*', protect, fileController.getFile);

module.exports = router;
