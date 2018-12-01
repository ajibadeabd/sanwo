const mongoose = require('mongoose')

const { Schema } = mongoose

const orderSchema = new Schema({
  orderDate: {
    type: Date,
    trim: true,
    required: true
  },
  orderStatus: {
    type: String,
    trim: true,
    required: true
  },
  trackOrder: {
    type: String,
    trim: true,
    required: true
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
  }


})

module.exports = mongoose.model('Order', orderSchema)