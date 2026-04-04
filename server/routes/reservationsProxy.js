const express = require('express')

const router = express.Router()

const APICARS_URL = process.env.APICARS_BASE_URL || 'https://apicars.info'
const API_KEY = process.env.APICARS_API_KEY || ''

// POST /api/reservations — захиалга илгээх
router.post('/', async (req, res) => {
  try {
    const url = new URL('/api/reservations', APICARS_URL)
    const response = await fetch(url.toString(), {
      method: 'POST',
      headers: {
        'x-api-key': API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(req.body),
    })
    if (!response.ok) {
      throw new Error(`apicars API алдаа: ${response.status}`)
    }
    const data = await response.json()
    res.json(data)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router
