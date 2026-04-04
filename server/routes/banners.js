const express = require('express')
const multer = require('multer')
const path = require('path')
const Banner = require('../models/Banner')
const auth = require('../middleware/auth')

const router = express.Router()

// Multer тохиргоо
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

// GET /api/banners — бүх баннер авах
router.get('/', async (req, res) => {
  try {
    const banners = await Banner.find().sort({ order: 1 })
    res.json(banners)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/banners — шинэ баннер нэмэх
router.post('/', auth, upload.single('image'), async (req, res) => {
  try {
    const { title, linkUrl, position, order, isActive } = req.body
    const imageUrl = req.file ? `/uploads/${req.file.filename}` : ''
    const banner = await Banner.create({
      title,
      imageUrl,
      linkUrl,
      position,
      order: Number(order) || 0,
      isActive: isActive !== 'false',
    })
    res.status(201).json(banner)
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

// PUT /api/banners/:id — баннер засах
router.put('/:id', auth, upload.single('image'), async (req, res) => {
  try {
    const updates = { ...req.body }
    if (req.file) {
      updates.imageUrl = `/uploads/${req.file.filename}`
    }
    if (updates.order) updates.order = Number(updates.order)
    if (updates.isActive !== undefined) {
      updates.isActive = updates.isActive !== 'false'
    }
    const banner = await Banner.findByIdAndUpdate(req.params.id, updates, {
      new: true,
    })
    if (!banner) return res.status(404).json({ error: 'Баннер олдсонгүй' })
    res.json(banner)
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

// DELETE /api/banners/:id — баннер устгах
router.delete('/:id', auth, async (req, res) => {
  try {
    const banner = await Banner.findByIdAndDelete(req.params.id)
    if (!banner) return res.status(404).json({ error: 'Баннер олдсонгүй' })
    res.json({ message: 'Баннер устгагдлаа' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router
