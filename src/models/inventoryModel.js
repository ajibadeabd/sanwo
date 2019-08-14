const autoIncrement = require('mongoose-auto-increment')
const mongoose = require('mongoose')


const { Schema } = mongoose

const InventorySchema = new Schema({
  name: {
    type: String,
    required: true
  },
  productNumber: {
    type: Number,
    default: 1,
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
  installmentPercentagePerMonth: [],
  quantity: {
    type: Number,
    required: true
  },
  images: [String],
  meta: {},
  status: {
    type: Boolean,
    default: false
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  deletedAt: Date,
  deletedBy: {
    type: Schema.ObjectId,
    ref: 'User'
  }
})

InventorySchema.statics = {
  valueExists (query) {
    return this.findOne(query)
      .then(result => result)
  }
}
autoIncrement.initialize(mongoose.connection)
InventorySchema.plugin(autoIncrement.plugin, {
  model: 'Order', field: 'productNumber', startAt: 1, incrementBy: 1
})
module.exports = mongoose.model('Inventory', InventorySchema)
