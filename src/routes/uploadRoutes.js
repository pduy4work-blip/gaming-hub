const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const { requireAuth } = require('../middleware/auth');

router.post('/', requireAuth, upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      error: 'Vui lòng chọn tập tin ảnh để tải lên.',
      code: 'NO_FILE_PROVIDED'
    });
  }

  const fileUrl = `/assets/uploads/${req.file.filename}`;
  return res.json({
    success: true,
    url: fileUrl,
    filename: req.file.filename,
    size: req.file.size
  });
});

module.exports = router;
