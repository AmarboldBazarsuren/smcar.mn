// Stub /api/cars router used when MAINTENANCE_MODE=true.
// Returns empty listings + 503 on detail so the site looks "down" without
// requiring frontend changes. Toggle with one env var.

const express = require('express')

const router = express.Router()

const EMPTY = { cars: [], total: 0, page: 1, totalPages: 1 }

router.get('/', (req, res) => res.set('Cache-Control', 'no-store').json(EMPTY))
router.get('/stats', (req, res) => res.set('Cache-Control', 'no-store').json({ totalCars: 0, highestCarNumber: 0, carsByWebsite: [] }))
router.get('/:id', (req, res) => res.status(503).json({ error: 'maintenance' }))
router.get('/:id/full', (req, res) => res.status(503).json({ error: 'maintenance' }))
router.post('/pricing-breakdown', (req, res) => res.status(503).json({ error: 'maintenance' }))

module.exports = router
