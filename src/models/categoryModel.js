const mongoose = require('mongoose')


const { Schema } = mongoose

const CategorySchema = new Schema({

  name: {
    type: String,
    required: true,
    unique: true,
  },
  slug: {
    type: String,
    trim: true,
    required: true,
    unique: true,
  },
  installmentPeriod: {
    type: Number,
    min: 0,
    default: 0
  },
  description: {
    type: String,
    trim: true,
  },
  categoryImage: {
    type: String,
  }


})

CategorySchema.statics = {
  valueExists (query) {
    return this.findOne(query)
      .then(result => result)
  }
}

module.exports = mongoose.model('Category', CategorySchema)
