const mongoose = require("mongoose");

const { Schema } = mongoose;

const CartApprovalSchema = new Schema({
  cart: {
    type: Schema.ObjectId,
    ref: "Cart",
    required: true
  },
  seller: {
    type: Schema.ObjectId,
    ref: "User",
    required: true
  },
  sellerApprovalToken: String,
  sellerApprovalStatus: String,
  sellerApprovalStatusChangeDate: Date,
  adminApprovalStatus: String,
  adminApprovalStatusChangedBy: {
    type: Schema.ObjectId,
    ref: "User"
  },
  adminApprovalStatusChangeDate: Date,
  adminApprovalToken: String,
  corporateAdminApprovalStatus: String,
  corporateAdminApprovalDate: Date,
  corporateAdminApprovalToken: String,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

CartApprovalSchema.statics = {
  valueExists(query) {
    return this.findOne(query).then(result => result);
  }
};

module.exports = mongoose.model("CartApproval", CartApprovalSchema);
