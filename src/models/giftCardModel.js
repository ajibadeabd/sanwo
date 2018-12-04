const mongoose = require('mongoose')


const { Schema } = mongoose

const giftSchema = new Schema({
  cardHash: {
    type: String,
    trim: true
  },
  price: {
    type: Number,
    required: true,
    trim: true
  },
  createDate: {
    type: Date,
    default: Date.now()
  }

})

giftSchema.methods.hasExpired = async () => {
  const now = new Date()
  const createDate = Date.now
  // once token is created, it cannot last more than 1hr
  return await now - createDate > 0.1
}

module.exports = mongoose.model('Gift', giftSchema)
