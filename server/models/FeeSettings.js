const mongoose = require('mongoose')

const feeSettingsSchema = new mongoose.Schema(
  {
    serviceFee: { type: Number, required: true, default: 700000 }, // ₩ Үйлчилгээний шимтгэл
    transportFee: { type: Number, required: true, default: 2500000 }, // ₩ Тээврийн зардал
    specialTax: { type: Number, required: true, default: 5 }, // % Онцгой албан татвар
    customsVat: { type: Number, required: true, default: 13 }, // % Гаалийн татвар/НӨАТ
    updatedBy: { type: String, default: 'admin' },
  },
  { timestamps: true }
)

module.exports = mongoose.model('FeeSettings', feeSettingsSchema)
