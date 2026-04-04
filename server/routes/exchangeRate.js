const express = require('express')
const ExchangeRate = require('../models/ExchangeRate')
const auth = require('../middleware/auth')

const router = express.Router()

// GET /api/exchange-rate — ханш авах
router.get('/', async (req, res) => {
  try {
    let rate = await ExchangeRate.findOne()
    if (!rate) {
      // Анхны ханш үүсгэх
      rate = await ExchangeRate.create({ wonToMnt: 2.8, euroToMnt: 3800, usdToMnt: 3450 })
    }
    res.json(rate)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// PUT /api/exchange-rate — ханш өөрчлөх
router.put('/', auth, async (req, res) => {
  try {
    const { wonToMnt, euroToMnt, usdToMnt } = req.body
    let rate = await ExchangeRate.findOne()
    if (!rate) {
      rate = await ExchangeRate.create({
        wonToMnt,
        euroToMnt,
        usdToMnt: usdToMnt || 3450,
        updatedBy: 'admin',
      })
    } else {
      rate.wonToMnt = wonToMnt
      rate.euroToMnt = euroToMnt
      if (usdToMnt !== undefined) rate.usdToMnt = usdToMnt
      rate.updatedBy = 'admin'
      await rate.save()
    }
    res.json(rate)
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

module.exports = router
