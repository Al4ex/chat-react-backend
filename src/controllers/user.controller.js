import mongoose from "mongoose";
import path from "path";
import fs from "fs-extra";
import { createToken } from "../helpers/jwt";
import User from "../models/user";
import Contact from "../models/Contacts";
import Message from "../models/Message";

// registrar usuario
const signIn = async (req, res) => {
  const { username, email, password } = req.body;

  const user = new User({
    username,
    email,
    password,
  });

  if (!password) {
    // user.encryptPassword(password)
    res.status(500).send({ message: "Ingrese la contraseña" });
  } else if (!email) {
    res.status(500).send({ message: "Ingrese su correo" });
  } else if (!username) {
    res.status(500).send({ message: "Ingrese su Nombre de usuario" });
  } else {
    const findUser = await User.findOne({ email });

    if (findUser) {
      res.status(400).send({ ok: false, message: "El correo ya existe" });
    } else {
      user.password = await user.encryptPassword(password);
      const response = await user.save();
      res.status(200).send({ ok: true, jwt: createToken(user), response });
    }
  }
};
// loggear usuario
const login = async (req, res) => {
  const { email, password, token } = req.body;
  try {
    const user = await User.findOne({ email });
    // Validar usuario
    if (!user) {
      return res
        .status(404)
        .send({ ok: false, message: "El correo no existe" });
    }

    // comparar contraseña
    const match = await user.comparePassword(password);
    if (!match) {
      return res
        .status(401)
        .send({ ok: false, message: "Contraseña invalida" });
    }

    if (token) {
      res.status(200).send({
        ok: true,
        jwt: createToken(user),
        message: "with token",
        user,
      });
    } else {
      res
        .status(200)
        .send({ ok: true, jwt: createToken(user), message: "sin token", user });
    }
  } catch (error) {
    res.status(500).send({ ok: false, message: error });
  }
};

const reNew = async (req, res) => {
  const user = req.user;

  const jwt = createToken(user);

  const response = await User.findById(user.id);
  return res.status(200).send({ ok: true, jwt, response });
};

const getUser = async (req, res) => {
  const { id } = req.params;

  try {
    const userId = mongoose.Types.ObjectId(id);

    const user = await User.findById(userId);
    if (user) {
      res.status(200).send({ user });
    } else {
      res.status(500).send({ message: "No existe usuario" });
    }
  } catch (error) {
    res.status(500).send({ message: "Error en el Id" });
  }
};
const getUsers = async (req, res) => {
  let usuario = mongoose.Types.ObjectId("63043bb710b7408efd9f277b");
  // try {
  // {
  // const users = await Contact.aggregate([
  //   // {
  //   //   $lookup: {
  //   //     from: "Contacts",
  //   //     localField: "_id",
  //   //     foreignField: "owner",
  //   //     as: "contact",
  //   //   },
  //   // },
  //   // {
  //   //   $unwind: "$contact",
  //   // },

  //   {
  //     $lookup: {
  //       from: "Users",
  //       let: {
  //         contact: "$contact",
  //         owner: "$owner",
  //       },
  //       pipeline: [
  //         {
  //           $match: {
  //             $expr: {
  //               $or: [{ $eq: ["$_id", "$$contact"] }],
  //             },
  //           },
  //         },
  //         { $sort: { createAt: -1 } },
  //       ],
  //       as: "contacto",
  //     },
  //   },
  //   { $unwind: "$contacto" },
  //   {
  //     $lookup: {
  //       from: "messages",
  //       let: {
  //         uid: "$owner",
  //       },
  //       pipeline: [
  //         {
  //           $match: {
  //             $expr: {
  //               $or: [{ $eq: ["$to", "$$uid"] }, { $eq: ["$from", "$$uid"] }],
  //             },
  //           },
  //         },
  //         { $sort: { createAt: -1 } }, // add sort if needed (for example, if you want first 100 comments by creation date)
  //         { $limit: 1 },
  //       ],
  //       as: "final",
  //     },
  //   },
  // ]).sort("-updatedAt");
  // const users2 = await Message.updateMany(
  //   { status: "unread" },
  //   { $set: { status: "read" } }
  // );
  // console.log(users2);
  const users = await User.aggregate([
    // {
    //   $lookup: {
    //     from: "Contacts",
    //     localField: "_id",
    //     foreignField: "owner",
    //     as: "contact",
    //   },
    // },
    // {
    //   $unwind: "$contact",
    // },
    { $match: { _id: usuario } },
    // {
    //   $lookup: {
    //     from: "Contacts",
    //     let: {
    //       uid: "$_id",
    //     },
    //     pipeline: [
    //       {
    //         $match: {
    //           $expr: {
    //             $or: [
    //               { $eq: ["$owner", "$$uid"] },
    //               { $eq: ["$contact", "$$uid"] },
    //             ],
    //           },
    //         },
    //       },
    //       { $sort: { createAt: -1 } },
    //     ],
    //     as: "final",
    //   },
    // },
    {
      $lookup: {
        from: "messages",
        let: {
          uid: "$_id",
        },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  {
                    $or: [
                      { $eq: ["$to", "$$uid"] },
                      { $eq: ["$from", "$$uid"] },
                    ],
                  },
                  {
                    $eq: ["$status", "unread"],
                  },
                ],
              },
            },
          },
          { $sort: { createAt: -1 } }, // add sort if needed (for example, if you want first 100 comments by creation date)
          // { $limit: 1 },
        ],
        as: "final",
      },
    },
  ]).sort("-updatedAt");
  //   $lookup: {
  //     from: "messages",
  //     localField: "_id",
  //     foreignField: "from",
  //     pipeline: [
  //       { $sort: { createAt: -1 } }, // add sort if needed (for example, if you want first 100 comments by creation date)
  //       { $limit: 1 },
  //     ],
  //     as: "final",
  //   },
  // },
  // const users = await User.aggregate([
  //   { $project: { _id: { _id: 1 } } },
  //   { $match: { $_id } },
  // ]);

  // if (users.length > 0) {
  res.status(200).send({ users });
  //   } else {
  //     res.status(404).send({ message: "No hay usuarios" });
  //   }
  // } catch (error) {
  //   res.status(500).send(error);
  // }
};

const desState = async (req, res) => {
  const { id } = req.params;

  try {
    const userId = mongoose.Types.ObjectId(id);

    const user = await User.findByIdAndUpdate(userId, { state: false });
    console.log(user);
    if (user) {
      res.status(200).send({ user });
    } else {
      res.status(500).send({ message: "No se puede actualizar estado" });
    }
  } catch (error) {
    res.status(500).send({ message: "Error en el Id" });
  }
};

const updateImage = async (req, res) => {
  const { id } = req.params;
  let userId = mongoose.Types.ObjectId(id);
  if (req.files.filename) {
    const { imagen } = await User.findById(userId);
    const image_name = req.files.filename;
    if (image_name != imagen) {
      await fs.remove(path.join(__dirname, "../uploads/users/" + imagen));
    }
    try {
      const user = await User.findByIdAndUpdate(userId, { imagen: image_name });

      if (user) {
        res.status(200).send({ user });
      } else {
        res.status(500).send({ message: "No se puede actualizar la foto" });
      }
    } catch (error) {
      res.status(500).send({ message: "Error en el Id" });
    }
  } else {
    res.status(404).send({ message: "No subiste la imagen" });
  }
};
const getImage = async (req, res) => {
  const { img } = req.params;
  let path_img;
  if (img != "null") {
    path_img = "./src/uploads/users/" + img;

    res.status(200).sendFile(path.resolve(path_img));
  } else {
    path_img = "./src/uploads/users/default.jpg";

    res.status(404).sendFile(path.resolve(path_img));
  }
};

const updateInfo = async (req, res) => {
  let { id } = req.params;
  const userId = mongoose.Types.ObjectId(id);
  const data = req.body;
  const user = new User();
  let filename = req.files[0];
  console.log(req.files[0]);
  if (req.files.length > 0) {
    if (data.password) {
      /** with image and pass */
      try {
        const newPass = await user.encryptPassword(data.password);

        const image_name = filename.filename;
        let { imagen } = await User.findById(userId);
        if (imagen != "default.jpg" || imagen != image_name) {
          await fs.remove(path.join(__dirname, "../uploads/users/" + imagen));
        }
        const newData = await User.findByIdAndUpdate(id, {
          username: data.username,
          password: newPass,
          imagen: image_name,
          telefono: data.telefono,
          bio: data.bio,
          facebook: data.facebook,
          twitter: data.twitter,
          state: data.state,
        });
        res.status(202).send(newData);
      } catch (error) {
        res.status(500).send("error en el servidor");
      }
    } else {
      /** with image without pass */
      try {
        const image_path = filename.filename;
        const image_name = image_path;
        let { imagen } = await User.findById(userId);
        console.log(path.join(__dirname, "../uploads/users/" + imagen));
        if (imagen != "default.jpg" || imagen != image_name) {
          await fs.remove(path.join(__dirname, "../uploads/users/" + imagen));
        }
        const newData = await User.findByIdAndUpdate(id, {
          username: data.username,
          imagen: image_name,
          telefono: data.telefono,
          bio: data.bio,
          facebook: data.facebook,
          twitter: data.twitter,
          state: data.state,
        });
        res.status(202).send(newData);
      } catch (error) {
        res.status(500).send("error en el servidor");
      }
    }
  } else {
    if (data.password) {
      /** without image but with pass */
      try {
        const newPass = await user.encryptPassword(data.password);

        const newData = await User.findByIdAndUpdate(id, {
          username: data.username,
          password: newPass,
          telefono: data.telefono,
          bio: data.bio,
          facebook: data.facebook,
          twitter: data.twitter,
          state: data.state,
        });
        res.status(202).send(newData);
      } catch (error) {
        res.status(500).send("error en el servidor2");
      }
    } else {
      /** without image without pass */
      try {
        const newData = await User.findByIdAndUpdate(userId, {
          username: data.username,
          telefono: data.telefono,
          bio: data.bio,
          facebook: data.facebook,
          twitter: data.twitter,
          state: data.state,
        });
        res.status(202).send(newData);
      } catch (error) {
        res.status(500).send(error);
      }
    }
  }
};

export {
  signIn,
  login,
  reNew,
  getUser,
  getUsers,
  desState,
  updateImage,
  getImage,
  updateInfo,
};
