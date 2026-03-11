const { Router } = require("express");
const validate = require("../middlewares/validate");
const contactValidation = require("../validations/contact.validation");
const contactController = require("../controllers/contact.controller");

const router = Router();

router.post(
  "/",
  validate(contactValidation.sendContactMessage),
  contactController.sendContactMessage,
);

module.exports = router;
