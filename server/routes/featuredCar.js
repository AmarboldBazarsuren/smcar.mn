const express = require('express')
const FeaturedCar = require('../models/FeaturedCar')
const auth = require('../middleware/auth')

const router = express.Router()

// GET /api/featured-car — онцлох зар авах
router.get('/', async (req, res) => {
  try {
    const cars = await FeaturedCar.find({ isActive: true })
    res.json(cars)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// PUT /api/featured-car — онцлох зар тохируулах
router.put('/', auth, async (req, res) => {
  try {
    const { carId, position } = req.body
    if (!carId) return res.status(400).json({ error: 'carId шаардлагатай' })

    const pos = position || 'middle'
    let featured = await FeaturedCar.findOne({ position: pos })
    if (!featured) {
      featured = await FeaturedCar.create({ carId, position: pos, isActive: true })
    } else {
      featured.carId = carId
      featured.isActive = true
      await featured.save()
    }
    res.json(featured)
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

// DELETE /api/featured-car/:position — онцлох зар устгах
router.delete('/:position', auth, async (req, res) => {
  try {
    await FeaturedCar.findOneAndUpdate(
      { position: req.params.position },
      { isActive: false }
    )
    res.json({ success: true })
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

module.exports = router
