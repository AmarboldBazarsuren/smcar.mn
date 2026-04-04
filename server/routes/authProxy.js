const express = require('express')
const jwt = require('jsonwebtoken')

const router = express.Router()

const JWT_SECRET = process.env.JWT_SECRET || 'smcar_jwt_secret'
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin'
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'smcar2024'

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { username, password } = req.body

  if (username !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Нэвтрэх нэр эсвэл нууц үг буруу байна' })
  }

  const accessToken = jwt.sign(
    { username, role: 'admin' },
    JWT_SECRET,
    { expiresIn: '7d' }
  )
  const refreshToken = jwt.sign(
    { username, role: 'admin', type: 'refresh' },
    JWT_SECRET,
    { expiresIn: '30d' }
  )

  res.json({ accessToken, refreshToken })
})

// GET /api/auth/verify
router.get('/verify', (req, res) => {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token байхгүй' })
  }

  try {
    const token = authHeader.split(' ')[1]
    const decoded = jwt.verify(token, JWT_SECRET)
    res.json({ valid: true, user: { username: decoded.username, role: decoded.role } })
  } catch {
    res.status(401).json({ error: 'Token хүчингүй' })
  }
})

// POST /api/auth/refresh
router.post('/refresh', (req, res) => {
  const { refreshToken } = req.body
  if (!refreshToken) {
    return res.status(400).json({ error: 'Refresh token шаардлагатай' })
  }

  try {
    const decoded = jwt.verify(refreshToken, JWT_SECRET)
    const accessToken = jwt.sign(
      { username: decoded.username, role: 'admin' },
      JWT_SECRET,
      { expiresIn: '7d' }
    )
    res.json({ accessToken })
  } catch {
    res.status(401).json({ error: 'Refresh token хүчингүй' })
  }
})

module.exports = router
