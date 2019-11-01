const express = require("express");
const paymentValidationMiddleware = require("./../functions/paymentValidationMiddleware");
const authMiddleware = require("./../functions/authMiddleware");

const paymentController = require("../controllers/paymentController");

const router = express.Router();

router.get("/processed", paymentController.notification);
router.get(
  "/mandate-status/:orderId",
  paymentController.installmentMandateStatus
);
router.post("/debit-notification", paymentController.debitNotification);

router.get(
  "/order/:orderNumber",
  paymentValidationMiddleware.getOrderPayments,
  paymentController.getOrderPayments
);

router.get(
  "/installment-payment-history/:orderId",
  paymentValidationMiddleware.installmentMandateStatus,
  paymentController.installmentPaymentHistory
);

router.get(
  "/:paymentId",
  paymentValidationMiddleware.getPayment,
  paymentController.getPayment
);

router.use(authMiddleware.isAuthenticated);

router.post(
  "/order",
  paymentValidationMiddleware.generateOrderPaymentRRR,
  paymentController.generateOrderPaymentRRR
);
module.exports = router;
