const mongoose = require('mongoose')

const featuredCarSchema = new mongoose.Schema(
  {
    carId: { type: String, required: true },
    position: { type: String, enum: ['hero', 'middle'], default: 'middle' },
    isActive: { type: Boolean, default: true },
    updatedBy: { type: String, default: 'admin' },
  },
  { timestamps: true }
)

module.exports = mongoose.model('FeaturedCar', featuredCarSchema)
