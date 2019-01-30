const mongoose = require('mongoose')


const { Schema } = mongoose

const PaymentSchema = new Schema({
  user: {
    type: Schema.ObjectId,
    ref: 'User',
    required: true,
  },
  seller: {
    type: Schema.ObjectId,
    ref: 'User',
  },
  module: {
    type: String,
    required: true,
  },
  moduleId: {
    type: String,
    required: true,
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
    trim: true,
    required: true
  },
  ipAddress: {
    type: String,
    required: true
  },
  authCode: {
    type: String,
    required: true
  },
  status: {
    type: String,
    required: true
  },
  channel: {
    type: String
  },
  paymentDate: {
    type: Date,
    default: Date.now
  },
  meta: {
    type: [],
    default: undefined
  },
  createdAt: {
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
