const express = require('express')

const router = express.Router()

// GET /api/image-proxy?url=... — apicars зургийг proxy-аар татах
router.get('/', async (req, res) => {
  const { url } = req.query
  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'URL шаардлагатай' })
  }

  try {
    const response = await fetch(url)
    if (!response.ok) {
      return res.status(response.status).json({ error: 'Зураг татахад алдаа гарлаа' })
    }

    const contentType = response.headers.get('content-type')
    if (contentType) {
      res.setHeader('Content-Type', contentType)
    }
    res.setHeader('Cache-Control', 'public, max-age=86400')

    const buffer = await response.arrayBuffer()
    res.send(Buffer.from(buffer))
  } catch {
    res.status(500).json({ error: 'Зураг татахад алдаа гарлаа' })
  }
})

module.exports = router
