const mongoose = require('mongoose')

const exchangeRateSchema = new mongoose.Schema(
  {
    wonToMnt: { type: Number, required: true, default: 2.8 },
    euroToMnt: { type: Number, required: true, default: 3800 },
    usdToMnt: { type: Number, required: true, default: 3450 },
    updatedBy: { type: String, default: 'admin' },
  },
  { timestamps: true }
)

module.exports = mongoose.model('ExchangeRate', exchangeRateSchema)
