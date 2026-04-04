const express = require('express')
const multer = require('multer')
const path = require('path')
const auth = require('../middleware/auth')

const router = express.Router()

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads'))
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1e9)
    cb(null, uniqueName + path.extname(file.originalname))
  },
})
const upload = multer({ storage })

// POST /api/upload/banner — баннер зураг upload
router.post('/banner', auth, upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Зураг байхгүй байна' })
  }
  res.json({ url: `/uploads/${req.file.filename}` })
})

// POST /api/upload/logo — лого upload
router.post('/logo', auth, upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Зураг байхгүй байна' })
  }
  res.json({ url: `/uploads/${req.file.filename}` })
})

module.exports = router
