const mongoose = require('mongoose')


const { Schema } = mongoose

const WishListSchema = new Schema({
  product: {
    type: Schema.ObjectId,
    ref: 'Inventory',
    required: true
  },
  user: {
    type: Schema.ObjectId,
    ref: 'User',
    required: true,
  },
  description: {
    type: String,
    trim: true,
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
})

WishListSchema.statics = {
  valueExists (query) {
    return this.findOne(query)
      .then(result => result)
  }
}


module.exports = mongoose.model('WishList', WishListSchema)
