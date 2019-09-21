const mongoose = require('mongoose')


const { Schema } = mongoose

const PaymentSchema = new Schema({
  user: {
    type: Schema.ObjectId,
    ref: 'User',
    required: true,
  },
  order: {
    type: Schema.ObjectId,
    ref: 'Order',
    required: true,
  },
  module: {
    type: String,
  },
  moduleId: {
    type: String,
  },
  amount: {
    type: Number,
    required: true,
  },
  transactionRef: {
    type: String,
    trim: true,
    required: true
  },
  transactionID: {
    type: String,
  },
  ipAddress: {
    type: String,
  },
  authCode: {
    type: String,
  },
  status: {
    type: String,
    required: true
  },
  channel: {
    type: String
  },
  meta: {
    type: {},
    default: undefined
  },
  hash: String,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
})

PaymentSchema.statics = {
  valueExists (query) {
    return this.findOne(query)
      .then(result => result)
  }
}

module.exports = mongoose.model('Payment', PaymentSchema)
