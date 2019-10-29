const express = require("express");
const multer = require("multer");
const inventoryValidation = require("../functions/inventoryValidationMiddleware");
const authMiddleware = require("./../functions/authMiddleware");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "./public/upload/products/");
  },
  filename: (req, file, cb) => {
    cb(
      null,
      `${new Date().toISOString()}_${file.originalname.replace(/\s/gi, "_")}`
    );
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 1024 * 1024 * 5 }
});
const inventoryController = require("../controllers/inventoryController");

const router = express.Router();

router.get("/", inventoryValidation.get, inventoryController.getInventories);
router.get(
  "/search/:keyword",
  inventoryValidation.search,
  inventoryController.searchInventories
);

router.get(
  "/all",
  authMiddleware.isAuthenticated,
  inventoryValidation.get,
  inventoryController.getAllInventories
);

router.get(
  "/seller/:seller",
  authMiddleware.isAuthenticated,
  inventoryValidation.get,
  inventoryController.getAllSellerInventories
);
router.put(
  "/:inventoryId",
  authMiddleware.isAuthenticated,
  upload.array("images"),
  inventoryValidation.update,
  inventoryController.update
);

// apply auth middleware
router.use(authMiddleware.isSeller);
// router.get('/me', inventoryController.getAllMyInventory)
router.post(
  "/",
  upload.array("images"),
  inventoryValidation.create,
  inventoryController.create
);
router.delete(
  "/:inventoryId",
  inventoryValidation.deleteInventory,
  inventoryController.deleteInventory
);
router.delete(
  "/image/:inventoryId",
  inventoryValidation.deleteImage,
  inventoryController.deleteImage
);
router.get("/stats", inventoryController.getInventoryStat);
router.get("/in-stock", inventoryController.getInventoryInStock);
router.get("/out-of-stock", inventoryController.getInventoryOutStock);
module.exports = router;
