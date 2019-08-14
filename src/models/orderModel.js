const mongoose = require('mongoose')
const autoIncrement = require('mongoose-auto-increment')
const installmentModel = require('./installmentModel')

/**
 * @Description Field description
 * @cart Array of the objects containing the user cart items i.e product,
 * quantity, unitPrice, subTotal. This way when a seller remove or update
 * a product it doesn't affect this order.
 * @token used for approval by the cooperative or super admin to updated
 * approval status of a purchase through email
 * @installmentPaymentStatus status of the installment payment
 * i.e maybe the customer has finished paying the installment
 * @installmentPeriod derived from the cart, the number of month
 * the customer is willing to installment
 * @installmentPercentage The percentage used in calculating the total amount the user will be
 * paying back
 * @approvalStatusChangedBy UserId of the person who approved installment payment for an order
 * @approvalStatusChangeDate the date which request to pay for installment was approved or reject
 * @installments array of sub-documents(@InstallmentSchema)
 * used to used in keeping track of installment payment
 * @payment Reference to payment record for a particular order which is not paid on installment
 */
const { Schema } = mongoose
const orderSchema = new Schema({
  orderNumber: {
    type: Number,
    default: 1,
  },
  buyer: {
    type: Schema.ObjectId,
    ref: 'User',
    required: true
  },
  address: {
    type: {},
    required: true
  },
  orderStatus: {
    type: String,
    trim: true,
    required: true
  },
  purchases: [{ type: Schema.ObjectId, ref: 'Purchase', required: true }],
  totalProduct: {
    type: Number,
    required: true
  },
  totalQuantities: {
    type: Number,
    required: true,
    minimum: 1
  },
  subTotal: {
    type: Number,
    required: true
  },
  token: {
    type: String
  },
  payment: {
    type: Schema.ObjectId,
    ref: 'Payment',
  },
  giftCard: {
    type: Schema.ObjectId,
    ref: 'GiftCard',
  },
  installmentPeriod: {
    type: Number,
  },
  installmentInterest: {
    type: Number,
  },
  installmentPercentage: {
    type: Number,
  },
  installmentTotalRepayment: {
    type: Number,
  },
  installmentsRepaymentSchedule: [{
    type: installmentModel.InstallmentSchema,
    default: undefined
  }],
  installmentPaymentMandate: {
    status: Boolean,
    statusChangeDate: Date,
    hash: String,
    mandateId: String,
    requestId: String,
    merchantId: String,
    bankAccount: Object,
    formUrl: String
  },
  installmentPaymentStatus: {
    type: String,
    trim: true,
  },
  approvalRecord: {
    type: Schema.ObjectId,
    ref: 'CartApproval'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
})

orderSchema.statics = {
  valueExists (query) {
    return this.findOne(query)
      .then(result => result)
  }
}

autoIncrement.initialize(mongoose.connection)
orderSchema.plugin(autoIncrement.plugin, {
  model: 'Order', field: 'orderNumber', startAt: 1, incrementBy: 1
})
module.exports = mongoose.model('Order', orderSchema)
