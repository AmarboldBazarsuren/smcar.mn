const mongoose = require('mongoose')

const reservationSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    carId: { type: String, required: true },
    comment: { type: String, default: '' },
    status: { type: String, enum: ['new', 'contacted', 'closed'], default: 'new' },
  },
  { timestamps: true }
)

module.exports = mongoose.model('Reservation', reservationSchema)
