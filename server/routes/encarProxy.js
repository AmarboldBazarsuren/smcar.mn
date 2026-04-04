const express = require('express')

const router = express.Router()

// GET /api/encar/:encarId/info — encar.com аас CC + бодит үнэ авах
router.get('/:encarId/info', async (req, res) => {
  try {
    const { encarId } = req.params
    const response = await fetch(
      `https://api.encar.com/v1/readside/vehicle/${encarId}`
    )
    if (!response.ok) {
      return res.status(404).json({ cc: null, price: null })
    }
    const data = await response.json()
    const cc = data?.spec?.displacement || null
    // advertisement.price нь 만원 нэгжтэй (жишээ: 2450 = 2450만원)
    const price = data?.advertisement?.price || null
    res.json({ cc, price })
  } catch (err) {
    res.status(500).json({ cc: null, price: null, error: err.message })
  }
})

// Хуучин endpoint-г дэмжих
router.get('/:encarId/cc', async (req, res) => {
  try {
    const { encarId } = req.params
    const response = await fetch(
      `https://api.encar.com/v1/readside/vehicle/${encarId}`
    )
    if (!response.ok) {
      return res.status(404).json({ cc: null })
    }
    const data = await response.json()
    res.json({ cc: data?.spec?.displacement || null })
  } catch (err) {
    res.status(500).json({ cc: null, error: err.message })
  }
})

module.exports = router
