const mongoose = require('mongoose')


const { Schema } = mongoose

const InventorySchema = new Schema({
  name: {
    type: String,
    required: true
  },
  description: {
    type: String,
    trim: true
  },
  seller: {
    type: Schema.ObjectId,
    ref: 'User',
    required: true
  },
  price: {
    type: Number,
    required: true,
    default: 0
  },
  category: {
    type: Schema.ObjectId,
    ref: 'Category',
    required: true
  },
  installmentPeriod: {
    type: Number,
    default: 0
  },
  images: [String],
  meta: {},
  updatedAt: {
    type: Date,
    default: Date.now
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
})

InventorySchema.statics = {
  valueExists (query) {
    return this.findOne(query)
      .then(result => result)
  }
}

module.exports = mongoose.model('Inventory', InventorySchema)
