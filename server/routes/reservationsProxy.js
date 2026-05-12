const express = require('express')
const Reservation = require('../models/Reservation')
const auth = require('../middleware/auth')

const router = express.Router()

// POST /api/reservations — хэрэглэгч машины захиалга илгээх
router.post('/', async (req, res) => {
  try {
    const { firstName, lastName, email, phone, car, comment } = req.body || {}
    if (!firstName || !lastName || !phone) {
      return res.status(400).json({ error: 'Овог, нэр, утас шаардлагатай' })
    }
    const doc = await Reservation.create({
      firstName: String(firstName).trim(),
      lastName: String(lastName).trim(),
      email: String(email || '').trim(),
      phone: String(phone).trim(),
      carId: String(car?.id || '').trim(),
      comment: String(comment || '').trim(),
    })
    res.json({ ok: true, id: doc._id })
  } catch (err) {
    console.error('reservation create error:', err.message)
    res.status(500).json({ error: err.message })
  }
})

// GET /api/reservations — admin (бүгдийг list)
router.get('/', auth, async (_req, res) => {
  try {
    const list = await Reservation.find().sort({ createdAt: -1 }).limit(500)
    res.json(list)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// PATCH /api/reservations/:id — admin status шинэчлэх
router.patch('/:id', auth, async (req, res) => {
  try {
    const { status } = req.body || {}
    if (!['new', 'contacted', 'closed'].includes(status)) {
      return res.status(400).json({ error: 'Зөв status оруулна уу' })
    }
    const doc = await Reservation.findByIdAndUpdate(req.params.id, { status }, { new: true })
    if (!doc) return res.status(404).json({ error: 'Олдсонгүй' })
    res.json(doc)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router
