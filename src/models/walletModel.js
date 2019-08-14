const mongoose = require('mongoose')

const { Schema } = mongoose

const WalletSchema = new Schema({
  seller: {
    type: Schema.ObjectId,
    ref: 'User',
    required: true,
  },
  order: {
    type: Schema.ObjectId,
    ref: 'Order',
    required: true
  },
  paymentRecord: {
    type: Schema.ObjectId,
    ref: 'Payment',
    required: true
  },
  purchase: {
    type: Schema.ObjectId,
    ref: 'Purchase',
    required: true
  },
  bankAccount: {
    type: Schema.ObjectId,
    ref: 'BankAccount',
  },
  status: {
    type: String,
    trim: true,
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  }
})

WalletSchema.statics = {
  valueExists (query) {
    return this.findOne(query)
      .then(result => result)
  }
}

module.exports = mongoose.model('Wallet', WalletSchema)
