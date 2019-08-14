const mongoose = require('mongoose')


const { Schema } = mongoose

const Sample = new Schema({
  name: {
    type: String,
    required: true
  },
  age: {
    type: Number,
    default: 0
  },
  location: String
})

module.exports = mongoose.model('Sample', Sample)
