import { gedContacts, saveContact } from "../controllers/contact.controller";
import { Router } from "express";

const router = Router();

router.post("/createContact", saveContact);
router.get("/all", gedContacts);

module.exports = router;
