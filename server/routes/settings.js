const express = require('express')
const Settings = require('../models/Settings')
const auth = require('../middleware/auth')

const router = express.Router()

// GET /api/settings — тохиргоо авах
router.get('/', async (req, res) => {
  try {
    let settings = await Settings.findOne()
    if (!settings) {
      // Анхны тохиргоо үүсгэх
      settings = await Settings.create({ siteName: 'SMCar Mongolia' })
    }
    res.json(settings)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// PUT /api/settings — тохиргоо хадгалах
router.put('/', auth, async (req, res) => {
  try {
    let settings = await Settings.findOne()
    if (!settings) {
      settings = await Settings.create(req.body)
    } else {
      Object.assign(settings, req.body)
      await settings.save()
    }
    res.json(settings)
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

module.exports = router
