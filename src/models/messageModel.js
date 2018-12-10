const mongoose = require('mongoose')

const Message = new mongoose.Schema({
  message: {
    type: String,
    required: true
  },
  fromUserId: {
    type: String,
    required: true
  },
  toUserId: {
    type: String,
    required: true
  },
  meta: [],
  createdAt: {
    type: Date,
    default: Date.now
  }
})

module.exports = mongoose.model('Message', Message)