const mongoose = require('mongoose')


const { Schema } = mongoose
const InstallmentSchema = new Schema({
  installmentRef: {
    type: String,
  },
  installmentPercentage: {
    type: Number,
  },
  amount: {
    type: Number,
  },
  status: {
    type: String,
    default: 'pending',
  },
  payment: {
    type: Schema.ObjectId,
    ref: 'Payment',
  },
  dueDate: {
    type: Date,
  },
  datePaid: {
    type: Date
  },
  meta: { },
  createdAt: {
    type: Date,
    default: Date.now
  }
})

InstallmentSchema.statics = {
  valueExists (query) {
    return this.findOne(query)
      .then(result => result)
  }
}

module.exports = { InstallmentSchema }
