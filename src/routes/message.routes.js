/**
 * Path: api/message
 */
import { Router } from "express";
import { getChat, updateMessage } from "../controllers/message.controller";
import { validarJWT } from "../middlewares/validate-jwt";

const router = Router();
router.get("/:from", validarJWT, getChat);
router.put("/read", validarJWT, updateMessage);

module.exports = router;
