const mongoose = require('mongoose')
const autoIncrement = require('mongoose-auto-increment')
const helpers = require('./../functions/helpers')


const { Schema } = mongoose

const orderSchema = new Schema({
  orderDate: {
    type: Date,
    trim: true,
    required: true
  },
  orderNumber: {
    type: Number,
    default: 1,
  },
  buyer: {
    type: Schema.ObjectId,
    ref: 'User',
    required: true
  },
  seller: {
    type: Schema.ObjectId,
    ref: 'User',
    required: true
  },
  orderStatus: {
    type: String,
    trim: true,
    default: helpers.constants.ORDER_STATUS.pending
  },
  trackOrder: {
    type: String,
    trim: true,
    default: 'Not Delivered'
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Inventory',
    required: true
  },
  orderPrice: {
    type: Number,
    trim: true,
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    default: 1
  },
  instNumber: {
    type: Number,
    required: true,
    default: 1
  },
  approvedBy: {
    type: Schema.ObjectId,
    ref: 'User',
  },
  approvalDate: {
    type: Date,
  },
  token: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  }

})

orderSchema.statics = {
  valueExists (query) {
    return this.findOne(query)
      .then(result => result)
  }
}

autoIncrement.initialize(mongoose.connection)
orderSchema.plugin(autoIncrement.plugin, {
  model: 'Order', field: 'orderNumber', startAt: 1, incrementBy: 1
})
module.exports = mongoose.model('Order', orderSchema)