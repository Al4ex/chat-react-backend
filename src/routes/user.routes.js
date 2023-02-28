import multer from "multer";
import { Router } from "express";
import path from "path";
import {
  desState,
  getUser,
  getUsers,
  login,
  signIn,
  reNew,
  updateImage,
  getImage,
  updateInfo,
  addContact
} from "../controllers/user.controller";
import { check } from "express-validator";
import { validarCampos } from "../middlewares/validar-campos";
import { validarJWT } from "../middlewares/validate-jwt";
// const path = multer({dest: './src/uploads/users/'} );

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, "../uploads/users/"));
  },
  filename: function (req, file, cb) {
    // cb(null, file.fieldname)
    const uniqueSuffix = Date.now() + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + "_" + file.originalname);
  },
});

const upload = multer({ storage: storage }).any();

const router = Router();
router.post(
  "/sigIn",
  [
    check("username", "Nombre de usuario Obligatorio").notEmpty(),
    check("email", "Correo Obligatorio").isEmail(),
    check("password", "Contraseña obligatoria").not().isEmpty(),
    validarCampos,
  ],
  signIn
);

router.post(
  "/login",
  [
    check("email", "Correo Obligatorio").isEmail(),
    check("password", "Contraseña obligatoria").not().isEmpty(),
    validarCampos,
  ],
  login
);
router.get("/renewToken", [validarJWT], reNew);

router.get("/user/:id", [validarJWT], getUser);
router.get("/users", getUsers);
router.post("/contact",[validarJWT], addContact);
router.put("/users/desactivar/:id", desState);
router.put("/users/edit/image/:id", upload, updateImage);
router.get("/users/image/:img", getImage);
router.put("/users/edit/user/:id", upload, updateInfo);

module.exports = router;
