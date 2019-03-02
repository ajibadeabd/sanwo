const mongoose = require('mongoose')


const { Schema } = mongoose

const BankAccountSchema = new Schema({

  user: {
    type: Schema.ObjectId,
    ref: 'User',
    required: true,
  },
  bankName: {
    type: String,
    trim: true,
    required: true,
  },
  accountName: {
    type: String,
    trim: true,
    required: true,
  },
  accountNumber: {
    type: String,
    trim: true,
    required: true,
    unique: true,
  },
  bankCode: {
    type: String,
    trim: true,
    required: true,
  }

})

BankAccountSchema.statics = {
  valueExists (query) {
    return this.findOne(query)
      .then(result => result)
  }
}

module.exports = mongoose.model('BankAccount', BankAccountSchema)
