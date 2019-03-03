const mongoose = require('mongoose')

const { Schema } = mongoose

const Message = new Schema({
  message: {
    type: String,
    required: true
  },
  fromUserId: {
    type: String,
    required: true,
    ref: 'User',
  },
  toUserId: {
    type: String,
    required: true,
    ref: 'User',
  },
  meta: [],
  createdAt: {
    type: Date,
    default: Date.now
  }
})

module.exports = mongoose.model('Message', Message)
