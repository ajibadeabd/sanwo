const fs = require('fs')

const constants = {
  SELLER: 'seller',
  BUYER: 'buyer',
  CORPORATE_ADMIN: 'corporate_admin',
  SUPER_ADMIN: 'super_admin',
  ACCOUNT_STATUS: {
    pending: 'pending',
    accepted: 'accepted',
    declined: 'declined',
    suspended: 'suspended',
  },
  ORDER_STATUS: {
    pending: 'pending',
    approved: 'approved',
    declined: 'declined',
    in_route: 'in_route',
    delivered: 'delivered',
    confirmed: 'confirmed',
    pending_payment: 'pending_payment',
    pending_approval: 'pending_approval',
  }
}

const removeFile = (path) => {
  fs.unlink(path, (err) => {
    if (err) {
      // log error
    }
  })
}


module.exports = {
  removeFile,
  constants,
}
