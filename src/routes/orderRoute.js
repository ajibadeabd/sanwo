const express = require("express");

const orderController = require("../controllers/orderController");
const orderValidationMiddleware = require("../functions/orderValidationMiddleware");
const authMiddleware = require("./../functions/authMiddleware");

const router = express.Router();

router.get("/:orderNumber", orderController.getSingleOrder);
router.use(authMiddleware.isAuthenticated);
router.post("/", orderValidationMiddleware.create, orderController.create);
router.post(
  "/installment",
  orderValidationMiddleware.createInstallmentOrder,
  orderController.createInstallmentOrder
);

router.put(
  "/update-order-status",
  orderValidationMiddleware.updateOrderStatus,
  orderController.updateOrderStatus
);

router.get("/", orderValidationMiddleware.get, orderController.getOrders);

module.exports = router;
