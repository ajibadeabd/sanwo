const mongoose = require('mongoose')


const { Schema } = mongoose

const AddressBookSchema = new Schema({

  user: {
    type: Schema.ObjectId,
    ref: 'User',
    required: true
  },
  firstName: {
    type: String,
    trim: true,
    required: true,
  },
  lastName: {
    type: String,
    trim: true,
    required: true,
  },
  phoneNumber: {
    type: String,
  },
  address: {
    type: String,
    required: true,
    trim: true,
  },
  additionalInfo: {
    type: String,
  },
  region: {
    type: String,
    required: true
  },
  city: {
    type: String,
    required: true
  }

})

AddressBookSchema.statics = {
  valueExists (query) {
    return this.findOne(query)
      .then(result => result)
  }
}

module.exports = mongoose.model('AddressBook', AddressBookSchema)
