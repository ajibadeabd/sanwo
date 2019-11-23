const Validator = require("./../functions/Validator");

const updateAccountStatusValidation = (req, res, next) => {
  const requestBody = { ...req.params, status: req.body.status };

  const validationRule = {
    userId: "required|mongoId|exists:User,_id",
    status: "required|valid_status"
  };

  Validator(requestBody, validationRule, {}, (err, status) => {
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

const addToHero = (req, res, next) => {
  const requestBody = { ...req.params, ...req.body };

  const validationRule = {
    imageUrl: "required",
    title: "required",
    subTitle: "required",
    action: "required",
    link: "required"
  };

  Validator(requestBody, validationRule, {}, (err, status) => {
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

const addToFeatured = (req, res, next) => {
  const requestBody = { ...req.params, ...req.body };

  const validationRule = {
    feature: "required|mongoId|exists:Inventory,_id"
  };

  Validator(requestBody, validationRule, {}, (err, status) => {
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

const removeFeature = (req, res, next) => {
  const requestBody = { ...req.params, ...req.body };

  const validationRule = {
    product: "required|mongoId|exists:Inventory,_id"
  };

  Validator(requestBody, validationRule, {}, (err, status) => {
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

const removeHero = (req, res, next) => {
  const requestBody = { ...req.params, ...req.body };

  const validationRule = {
    item: "required|mongoId"
  };

  Validator(requestBody, validationRule, {}, (err, status) => {
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

const deleteAccount = (req, res, next) => {
  const requestBody = { ...req.params };

  const validationRule = {
    userId: "required|mongoId|exists:User,_id"
  };

  Validator(requestBody, validationRule, {}, (err, status) => {
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

const updateInventoryStatus = (req, res, next) => {
  const requestBody = { ...req.params, ...req.body };

  const validationRule = {
    product: "required|mongoId|exists:Inventory,_id",
    status: "required|boolean"
  };

  Validator(requestBody, validationRule, {}, (err, status) => {
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

const profileUpdate = (req, res, next) => {
  const requestBody = { ...req.params, ...req.body };

  const validationRule = {
    name: "sometimes|required",
    email: "sometimes|email|exists:User,email",
    password: "sometimes|password_policy|confirmed",
    old_password: "required_with:password"
  };

  Validator(requestBody, validationRule, {}, (err, status) => {
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
const profileUpdateNew = (req, res, next) => {
  const requestBody = { ...req.params, ...req.body };

  const validationRule = {
    firstName: "sometimes|required",
    lastName: "sometimes|required",
    phone: "sometimes"
  };

  Validator(requestBody, validationRule, {}, (err, status) => {
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

module.exports = {
  updateAccountStatusValidation,
  profileUpdate,
  updateInventoryStatus,
  deleteAccount,
  profileUpdateNew,
  removeHero,
  removeFeature,
  addToFeatured,
  addToHero
};
