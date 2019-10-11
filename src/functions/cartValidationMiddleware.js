const Validator = require("./../functions/Validator");

const create = (req, res, next) => {
  const validationRule = {
    product: "required|mongoId|exists:Inventory,_id",
    quantity: "required|numeric",
    installmentPeriod: "numeric|min:1",
    meta: "isJson"
  };

  Validator(req.body, validationRule, {}, (err, status) => {
    if (!status) {
      res.status(400).send({
        success: false,
        message: "Validation failed",
        data: err
      });
    } else {
      next();
    }
  });
};

const reduceCartQuantity = (req, res, next) => {
  const validationRule = {
    cart: "required|mongoId|exists:Cart,_id",
    quantity: "required|numeric|min:1"
  };

  Validator(
    { ...req.body, ...req.params },
    validationRule,
    {},
    (err, status) => {
      if (!status) {
        res.status(400).send({
          success: false,
          message: "Validation failed",
          data: err
        });
      } else {
        next();
      }
    }
  );
};

const get = (req, res, next) => {
  const validationRule = {
    _id: "mongoId"
  };

  Validator(req.query, validationRule, {}, (err, status) => {
    if (!status) {
      res.status(400).send({
        success: false,
        message: "Validation failed",
        data: err
      });
    } else {
      next();
    }
  });
};

const destroy = (req, res, next) => {
  const validationRule = { cart: "required|mongoId|exists:Cart,_id" };
  Validator(req.params, validationRule, {}, (err, status) => {
    if (!status) {
      res.status(400).send({
        success: false,
        message: "Validation failed",
        data: err
      });
    } else {
      next();
    }
  });
};

const requestApproval = (req, res, next) => {
  const validationRule = { cartId: "required|mongoId|exists:Cart,_id" };
  Validator(req.body, validationRule, {}, (err, status) => {
    if (!status) {
      res.status(400).send({
        success: false,
        message: "Validation failed",
        data: err
      });
    } else {
      next();
    }
  });
};

const updateApprovalStatus = (req, res, next) => {
  const validationRule = {
    token: "required",
    userId: "required|mongoId|exists:User,_id",
    status: "required|valid_order_status"
  };

  Validator(req.params, validationRule, {}, (err, status) => {
    if (!status) {
      res.status(400).send({
        success: false,
        message: "Validation Failed",
        data: err
      });
    } else {
      next();
    }
  });
};

module.exports = {
  get,
  create,
  destroy,
  reduceCartQuantity,
  requestApproval,
  updateApprovalStatus
};
