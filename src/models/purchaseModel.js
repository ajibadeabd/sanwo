const mongoose = require('mongoose')
const autoIncrement = require('mongoose-auto-increment')

const { Schema } = mongoose

const PurchaseSchema = new Schema({
  purchaseNumber: {
    type: Number,
    default: 1,
  },
  product: {
    type: {},
    required: true
  },
  order: {
    type: Schema.ObjectId,
    ref: 'Order',
    required: true,
  },
  seller: {
    type: Schema.ObjectId,
    ref: 'User',
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    minimum: 1,
  },
  unitPrice: {
    type: Number,
    required: true,
  },
  subTotal: {
    type: Number,
    required: true,
  },
  hasInstallment: {
    type: Boolean
  },
  paymentDisbursed: {
    type: Schema.ObjectId,
    ref: 'Payment',
  },
  status: {
    type: String,
    trim: true,
    required: true
  },
  trackingDetails: {
    type: String,
  },
  meta: {},
  createdAt: {
    type: Date,
    default: Date.now
  }
})

PurchaseSchema.statics = {
  valueExists (query) {
    return this.findOne(query)
      .then(result => result)
  }
}

autoIncrement.initialize(mongoose.connection)
PurchaseSchema.plugin(autoIncrement.plugin, {
  model: 'Purchase', field: 'purchaseNumber', startAt: 1, incrementBy: 1
})
module.exports = mongoose.model('Purchase', PurchaseSchema)
