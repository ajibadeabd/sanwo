const express = require("express");

const router = express.Router();
const adminController = require("../controllers/adminController");
const adminValidationMiddleware = require("../functions/adminValidationMiddleware");

router.post(
  "/add-to-hero",
  adminValidationMiddleware.addToHero,
  adminController.AddItemToHero
);
router.post(
  "/add-to-featured-list",
  adminValidationMiddleware.addToFeatured,
  adminController.AddItemToFeatured
);

router.delete(
  "/remove-from-hero/:item",
  adminValidationMiddleware.removeHero,
  adminController.RemoveItemFromHero
);
router.delete(
  "/remove-from-featured-list/:product",
  adminValidationMiddleware.removeFeature,
  adminController.RemoveItemFromFeatured
);

router.put(
  "/update-account-status/:userId",
  adminValidationMiddleware.updateAccountStatusValidation,
  adminController.updateAccountStatus
);

router.put("/update-inventory/:inventoryId", adminController.updateInventory);

router.delete(
  "/delete-user-account/:userId",
  adminValidationMiddleware.deleteAccount,
  adminController.deleteAccount
);

router.put(
  "/update-inventory-status/:product",
  adminValidationMiddleware.updateInventoryStatus,
  adminController.updateInventoryStatus
);

router.get("/get-users", adminController.getUsers);
router.get("/user-stats", adminController.getUserStatistics);

router.put(
  "/",
  adminValidationMiddleware.profileUpdateNew,
  adminController.profileUpdate
);
router.get(
  "/members-order-approval/:token/:cart/:status",
  adminController.approveMemberOrder
);
router.get("/members-purchases", adminController.getPendingApprovalOrders);

module.exports = router;
