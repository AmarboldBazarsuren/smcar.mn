const mongoose = require('mongoose')

const manualCarSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    brand: { type: String, required: true },
    model: { type: String },
    year: { type: Number, required: true },
    price: { type: Number, required: true }, // MNT (₮)
    mileage: { type: Number, default: 0 },
    fuelType: { type: String, default: 'Gasoline' },
    transmission: { type: String, default: 'Auto' },
    cc: { type: Number },
    color: { type: String },
    body_type: { type: String },
    description: { type: String },
    images: [{ type: String }], // local file paths
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
)

module.exports = mongoose.model('ManualCar', manualCarSchema)
