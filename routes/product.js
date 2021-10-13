const express = require("express");

const {
  resizeProductImages,
  createProductHandler,
  uploadProdcutImages,
  updateProductHandler,
  deleteProductHandler,
  getAllProducts,
  getSingleProduct,
} = require("../controller/products.controller");
const protect = require("../middleware/protect");
const router = express.Router();

router
  .route("/")
  .get(getAllProducts)
  .post(
    protect,
    uploadProdcutImages,
    resizeProductImages,
    createProductHandler,
  );

router
  .route("/:id")
  .get(getSingleProduct)
  .patch(
    protect,
    uploadProdcutImages,
    resizeProductImages,
    updateProductHandler,
  )
  .delete(protect, deleteProductHandler);

module.exports = router;
