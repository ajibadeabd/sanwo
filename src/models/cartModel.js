const mongoose = require('mongoose')


const { Schema } = mongoose

const CartSchema = new Schema({
  product: {
    type: Schema.ObjectId,
    ref: 'Inventory',
    required: true
  },
  user: {
    type: Schema.ObjectId,
    ref: 'User',
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    minimum: 1,
  },
  installmentPeriod: {
    type: Number,
  },
  installmentPercentage: {
    type: Number,
  },
  unitPrice: {
    type: Number,
    required: true,
  },
  subTotal: {
    type: Number,
    required: true,
  },
  installmentInterest: {
    type: Number,
  },
  installmentTotalRepayment: {
    type: Number,
  },
  meta: {},
  createdAt: {
    type: Date,
    default: Date.now
  }
})

CartSchema.statics = {
  valueExists (query) {
    return this.findOne(query)
      .then(result => result)
  }
}

module.exports = mongoose.model('Cart', CartSchema)
