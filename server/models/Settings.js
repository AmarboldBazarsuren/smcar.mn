const mongoose = require('mongoose')

const settingsSchema = new mongoose.Schema(
  {
    siteName: { type: String, default: 'SMCar Mongolia' },
    logoUrl: { type: String, default: '' },
    phone: { type: String, default: '' },
    email: { type: String, default: '' },
    address: { type: String, default: '' },
    socialLinks: {
      facebook: { type: String, default: '' },
      instagram: { type: String, default: '' },
    },
  },
  { timestamps: true }
)

module.exports = mongoose.model('Settings', settingsSchema)
