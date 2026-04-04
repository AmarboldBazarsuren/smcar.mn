const express = require('express')
const FeeSettings = require('../models/FeeSettings')
const auth = require('../middleware/auth')

const router = express.Router()

// GET /api/fees — татвар/шимтгэл авах
router.get('/', async (req, res) => {
  try {
    let fees = await FeeSettings.findOne()
    if (!fees) {
      fees = await FeeSettings.create({})
    }
    res.json(fees)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// PUT /api/fees — татвар/шимтгэл өөрчлөх
router.put('/', auth, async (req, res) => {
  try {
    const { serviceFee, transportFee, specialTax, customsVat } = req.body
    let fees = await FeeSettings.findOne()
    if (!fees) {
      fees = await FeeSettings.create({ serviceFee, transportFee, specialTax, customsVat })
    } else {
      if (serviceFee !== undefined) fees.serviceFee = serviceFee
      if (transportFee !== undefined) fees.transportFee = transportFee
      if (specialTax !== undefined) fees.specialTax = specialTax
      if (customsVat !== undefined) fees.customsVat = customsVat
      fees.updatedBy = 'admin'
      await fees.save()
    }
    res.json(fees)
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

module.exports = router
