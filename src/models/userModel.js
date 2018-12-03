const mongoose = require('mongoose')
const bcrypt = require('bcrypt')
const helpers = require('./../functions/helpers')

/**
 * @cooperative References the cooperative a user belongs to
 * @accountType This can either be seller, buyer, corporate_admin or Paysmosmo Admin(super_admin)
 * @status user status which can be either pending(default), accepted, declined, suspended
 * @businessRegistrationDocument file name of the uploaded document
 * @relatedUsers a corporate admin can create other users which he can manage. This field
 * will contain IDs of users he's created.
 */
const { Schema } = mongoose
const UserSchema = new Schema({
  name: {
    type: String,
    trim: true
  },
  firstName: {
    type: String,
    trim: true,
  },
  lastName: {
    type: String,
    trim: true
  },
  email: {
    type: String,
    trim: true,
    unique: true,
  },
  phoneNumber: {
    type: String,
    trim: true,
  },
  businessName: {
    type: String,
    trim: true,
  },
  businessRegistrationNumber: {
    type: String,
    trim: true,
  },
  businessRegistrationDocument: {
    type: String,
    trim: true,
  },
  businessAddress: {
    type: String,
    trim: true,
  },
  businessProductCategory: {
    type: String,
    trim: true,
  },
  businessSellingInOtherWebsite: {
    type: Boolean,
  },
  accountType: {
    type: String,
    trim: true,
    lowercase: true,
    required: [true, 'Please specify account type']
  },
  cooperative: {
    type: Schema.ObjectId,
    ref: 'User'
  },
  status: {
    type: String,
    trim: true,
    lowercase: true,
    default: helpers.constants.ACCOUNT_STATUS.pending
  },
  relatedUsers: [new Schema({ _id: Schema.ObjectId })],
  password: {
    type: String,
    trim: true,
  }
})


UserSchema.statics = {
  valueExists (query) {
    return this.findOne(query)
      .then(result => result)
  }
}

UserSchema.pre('save', function (next) {
  if (this.password) this.password = bcrypt.hashSync(this.password, 10)
  next()
})
module.exports = mongoose.model('User', UserSchema)