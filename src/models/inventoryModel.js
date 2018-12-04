const mongoose = require('mongoose')


const { Schema } = mongoose

const InventorySchema = new Schema({

  itemName: {
    type: String,
    required: true
  },
  productCategory: {
    type: String,
    trim: true,
    required: true
  },
  description: {
    type: String,
    trim: true,
    required: true
  },

  price: {
    type: Number,
    required: true,
    default: 0
  },
  productImage: {
    type: String,
    required: true
  }


})

module.exports = mongoose.model('Inventory', InventorySchema);