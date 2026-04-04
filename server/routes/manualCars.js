const express = require('express')
const multer = require('multer')
const path = require('path')
const fs = require('fs')
const ManualCar = require('../models/ManualCar')
const auth = require('../middleware/auth')

const router = express.Router()

// Multer config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '..', 'uploads', 'cars')
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
    cb(null, dir)
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname)
    cb(null, `car_${Date.now()}_${Math.random().toString(36).slice(2, 8)}${ext}`)
  },
})
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['.jpg', '.jpeg', '.png', '.webp']
    const ext = path.extname(file.originalname).toLowerCase()
    cb(null, allowed.includes(ext))
  },
})

// GET /api/manual-cars — бүх машин
router.get('/', async (req, res) => {
  try {
    const cars = await ManualCar.find({ isActive: true }).sort({ createdAt: -1 })
    res.json(cars)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/manual-cars — шинэ машин нэмэх
router.post('/', auth, upload.array('images', 10), async (req, res) => {
  try {
    const { title, brand, model, year, price, mileage, fuelType, transmission, cc, color, body_type, description } = req.body
    const images = (req.files || []).map((f) => `/uploads/cars/${f.filename}`)

    const car = await ManualCar.create({
      title, brand, model,
      year: Number(year),
      price: Number(price),
      mileage: Number(mileage) || 0,
      fuelType, transmission,
      cc: cc ? Number(cc) : undefined,
      color, body_type, description,
      images,
    })
    res.status(201).json(car)
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

// PUT /api/manual-cars/:id — засах
router.put('/:id', auth, upload.array('images', 10), async (req, res) => {
  try {
    const car = await ManualCar.findById(req.params.id)
    if (!car) return res.status(404).json({ error: 'Олдсонгүй' })

    const { title, brand, model, year, price, mileage, fuelType, transmission, cc, color, body_type, description, keepImages } = req.body

    if (title) car.title = title
    if (brand) car.brand = brand
    if (model !== undefined) car.model = model
    if (year) car.year = Number(year)
    if (price) car.price = Number(price)
    if (mileage !== undefined) car.mileage = Number(mileage) || 0
    if (fuelType) car.fuelType = fuelType
    if (transmission) car.transmission = transmission
    if (cc !== undefined) car.cc = cc ? Number(cc) : undefined
    if (color !== undefined) car.color = color
    if (body_type !== undefined) car.body_type = body_type
    if (description !== undefined) car.description = description

    // Хадгалах зургуудын жагсаалт (keepImages = JSON array of paths to keep)
    const kept = keepImages ? JSON.parse(keepImages) : car.images
    // Устгагдсан зургуудыг файлаас устгах
    for (const img of car.images) {
      if (!kept.includes(img)) {
        const filePath = path.join(__dirname, '..', img)
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath)
      }
    }

    // Шинэ зургууд нэмэх
    const newImages = (req.files || []).map((f) => `/uploads/cars/${f.filename}`)
    car.images = [...kept, ...newImages]

    await car.save()
    res.json(car)
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

// DELETE /api/manual-cars/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    const car = await ManualCar.findById(req.params.id)
    if (!car) return res.status(404).json({ error: 'Олдсонгүй' })
    // Зургуудыг устгах
    for (const img of car.images) {
      const filePath = path.join(__dirname, '..', img)
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath)
    }
    await ManualCar.findByIdAndDelete(req.params.id)
    res.json({ success: true })
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

// GET /api/manual-cars/storage — storage мэдээлэл
router.get('/storage', auth, async (req, res) => {
  try {
    const dir = path.join(__dirname, '..', 'uploads', 'cars')
    let totalSize = 0
    let fileCount = 0
    if (fs.existsSync(dir)) {
      const files = fs.readdirSync(dir)
      fileCount = files.length
      for (const f of files) {
        const stats = fs.statSync(path.join(dir, f))
        totalSize += stats.size
      }
    }
    res.json({
      fileCount,
      totalSizeBytes: totalSize,
      totalSizeMB: (totalSize / 1024 / 1024).toFixed(1),
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router
