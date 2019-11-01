const fs = require("fs");

const constants = {
  SELLER: "seller",
  BUYER: "buyer",
  CORPORATE_ADMIN: "corporate_admin",
  SUPER_ADMIN: "super_admin",
  ACCOUNT_STATUS: {
    pending: "pending",
    accepted: "accepted",
    declined: "declined",
    suspended: "suspended"
  },
  ORDER_STATUS: {
    pending: "pending",
    approved: "approved",
    declined: "declined",
    in_route: "in_route",
    delivered: "delivered",
    confirmed: "confirmed",
    pending_payment: "pending_payment",
    payment_completed: "payment_completed",
    payment_failed: "payment_failed",
    pending_approval: "pending_approval"
  },
  PAYMENT_STATUS: {
    transaction_completed_successfully: "00",
    transaction_approved: "01",
    transaction_failed: "02",
    user_aborted_transaction: "012",
    invalid_user_authentication: "020",
    transaction_pending: "021",
    invalid_request: "022",
    service_type_or_merchant_does_not_exist: "023",
    payment_reference_generated: "025",
    transaction_already_processed: "027",
    invalid_bank_code: "029",
    insufficient_balance: "030",
    no_funding_account: "031",
    invalid_date_format: "032",
    initial_request_ok: "040",
    unknown_error: "999",
    pending_payment: "pending_payment"
  },
  WALLET_STATUS: {
    payment_confirmed: "payment_confirmed",
    withdrawal_in_progress: "withdrawal_in_progress",
    payment_withdrawal_successful: "payment_withdrawal_successful",
    reversed_payment: "reversed_payment"
  }
};
const remitaConfig = {
  baseUrl: "https://remitademo.net/remita",
  baseUrlHttp: "http://www.remitademo.net/remita",
  serviceTypeId: "4430731",
  apiKey: "1946",
  merchantId: "2547916"
};

const removeFile = path => {
  fs.unlink(path, err => {
    if (err) {
      // log error
    }
  });
};

module.exports = {
  removeFile,
  constants,
  remitaConfig
};
