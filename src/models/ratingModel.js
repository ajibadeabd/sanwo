const mongoose = require('mongoose')

const { Schema } = mongoose

const RatingSchema = new Schema({
  product: {
    type: Schema.ObjectId,
    ref: 'Inventory',
    required: true
  },
  user: {
    type: Schema.ObjectId,
    ref: 'User',
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  review: {
    type: String
  }
})

RatingSchema.statics = {
  valueExists (query) {
    return this.findOne(query)
      .then(result => result)
  }
}

module.exports = mongoose.model('Rating', RatingSchema)
