import User from "../models/user";
import Contact from "../models/Contacts";
import Message from "../models/Message"
import mongoose from "mongoose";

const userConnect = async (uid) => {
  const userFind = await User.findById(uid);
  userFind.state = true;
  await userFind.save();

  return userFind;
};

const userDisconnect = async (uid) => {
  const userFind = await User.findById(uid);
  userFind.state = false;
  await userFind.save();

  return userFind;
};

const getUsers = async (id) => {

    try {
      let userId = mongoose.Types.ObjectId(id);
      const user = await User.findById(userId);

      const result = await User.aggregate([
        // Buscamos los contactos del usuario
        { $match: { _id: { $in: user.contactos } } },
      
        // Unimos la colección de mensajes
        {
          $lookup: {
            from: 'messages',
            let: { contacto_id: '$_id', userId },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      {
                        $or: [
                          { $eq: ['$from', userId] },
                          { $eq: ['$to', userId] }
                        ]
                      },
                      {
                        $or: [
                          { $eq: ['$from', '$$contacto_id'] },
                          { $eq: ['$to', '$$contacto_id'] }
                        ]
                      },
                      { $eq: ['$status', 'unread'] }
                    ]
                  }
                }
              },
              { $sort: { createAt: -1 } },
              // { $limit: 1},
              {
                $project: {
                  _id: 1,
                  from: 1,
                  to: 1,
                  contenido: 1,
                  createAt: 1,
                  unread: { $cond: [ { $eq: ['$status', 'unread'] }, 1, 0 ] }
                }
              }
            ],
            as: 'mensajes'
          }
        },
      
        // Proyectamos el resultado
        {
          $project: {
            contacto: {
              $mergeObjects: [
                '$$ROOT',
                {
                  mensajes: { $arrayElemAt: ['$mensajes', 0] },
                  unread: { $sum: '$mensajes.unread' }
                }
              ]
            }
            // contacto: {
            //   _id: '$_id',
            //   nombre: 1,
            //   apellido: 1,
            //   email: 1,
            //   contactos: 1,
            //   mensajes: { $arrayElemAt: ['$mensajes', 0] }
            // }
          }
        }
      ]);
      
      // Retornamos el resultado
      return result;
    } catch (error) {
      console.error('Error al buscar los contactos y los mensajes:', error.message);
      return { message: 'Error al buscar los contactos y los mensajes' };
    }
};

const users = Contact.aggregate([
  {
    $lookup: {
      from: "Users",
      let: {
        listContact: "$contact",
      },
      pipeline: [
        /* {
          $match: {
            $expr: {
              $in: ["$_id", "$$listContact"],
            },
          },
        }, */
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
            as: "message",
          },
        },
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
                    $or: [
                      { $eq: ["$to", "$$uid"] },
                      { $eq: ["$from", "$$uid"] },
                    ],
                  },
                },
              },
              { $sort: { createAt: -1 } }, // add sort if needed (for example, if you want first 100 comments by creation date)
              { $limit: 1 },
            ],
            as: "lastMsg",
          },
        },
      ],
      // localField: "contact",
      // foreignField: "_id",
      as: "user",
    },
  },
  {
    $unwind: "$user",
  },
]);

export { userConnect, userDisconnect, getUsers };
