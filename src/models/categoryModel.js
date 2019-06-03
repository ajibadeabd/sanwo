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
  description: {
    type: String,
    trim: true,
  },
  parent: {
    type: Schema.ObjectId,
    ref: 'Category'
  },
  children: [{
    type: Schema.ObjectId,
    ref: 'Category',
  }],
  icon: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now
  }


})

CategorySchema.statics = {
  valueExists (query) {
    return this.findOne(query)
      .then(result => result)
  }
}

module.exports = mongoose.model('Category', CategorySchema)
