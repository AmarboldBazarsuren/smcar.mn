const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')
const path = require('path')
require('dotenv').config()

const bannersRouter = require('./routes/banners')
const settingsRouter = require('./routes/settings')
const exchangeRateRouter = require('./routes/exchangeRate')
const uploadRouter = require('./routes/upload')
const imageProxyRouter = require('./routes/imageProxy')
const carsProxyRouter = require('./routes/carsProxy')
const carapisDirectRouter = require('./routes/carapisDirect')
const maintenanceRouter = require('./routes/maintenance')
const photoProxyRouter = require('./routes/photoProxy')
const reservationsProxyRouter = require('./routes/reservationsProxy')
const authProxyRouter = require('./routes/authProxy')
const feeSettingsRouter = require('./routes/feeSettings')
const featuredCarRouter = require('./routes/featuredCar')
const manualCarsRouter = require('./routes/manualCars')

const app = express()
const PORT = process.env.PORT || 5000

// Middleware
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:5173',
    'https://smcar.mn',
    'https://www.smcar.mn',
    /\.vercel\.app$/,
  ],
  credentials: true,
}))
app.use(express.json())
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))

// Routes
app.use('/api/banners', bannersRouter)
app.use('/api/settings', settingsRouter)
app.use('/api/exchange-rate', exchangeRateRouter)
app.use('/api/upload', uploadRouter)
app.use('/api/image-proxy', imageProxyRouter)
// Opaque photo proxy: /api/p/<base64>.jpg → upstream CDN (hidden)
app.use('/api/p', photoProxyRouter)

// MAINTENANCE_MODE=true hides every car (returns empty list / 503 detail)
// without requiring any frontend redeploy.
const maintenance = (process.env.MAINTENANCE_MODE || '').toLowerCase() === 'true'

// DATA_SOURCE switch:
//   carapis  → api.carapis.com public catalog
//   apicars  → legacy apicars.info middleman (default)
const dataSource = (process.env.DATA_SOURCE || 'apicars').toLowerCase()
if (maintenance) {
  console.log('[cars] MAINTENANCE_MODE — serving empty lists')
  app.use('/api/cars', maintenanceRouter)
} else if (dataSource === 'carapis') {
  console.log('[cars] source = Carapis')
  app.use('/api/cars', carapisDirectRouter)
} else {
  console.log('[cars] source = apicars.info')
  app.use('/api/cars', carsProxyRouter)
}
app.use('/api/reservations', reservationsProxyRouter)
app.use('/api/auth', authProxyRouter)
app.use('/api/fees', feeSettingsRouter)
app.use('/api/featured-car', featuredCarRouter)
app.use('/api/manual-cars', manualCarsRouter)

// MongoDB холболт
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('MongoDB холбогдлоо')
    app.listen(PORT, () => {
      console.log(`Сервер ${PORT} порт дээр ажиллаж байна`)
    })
  })
  .catch((err) => {
    console.error('MongoDB холболтын алдаа:', err.message)
  })
