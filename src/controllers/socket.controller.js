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
  console.log('llega');
  const userFind = await User.findById(uid);
  userFind.state = false;
  userFind.ultimaConexion = new Date();
  await userFind.save();

  return userFind;
};

const getUsers = async () => {
  try {
    const users = await User.find(); // Obtenemos todos los usuarios

    const result = await User.aggregate([
      // Buscamos los contactos de todos los usuarios
      { $match: { _id: { $in: users.map(user => user._id) } } },
      // Buscamos los documentos de contacto
      {
        $lookup: {
          from: 'Users',
          localField: 'contactos',
          foreignField: '_id',
          as: 'contactos'
        }
      },
      // Buscamos el último mensaje con cada contacto
      {
        $unwind: '$contactos'
      },
      {
        $lookup: {
          from: 'messages',
          let: { usuarioId: '$_id', contactoId: '$contactos._id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$from', '$$usuarioId'] },
                    { $eq: ['$to', '$$contactoId'] }
                  ]
                }
              }
            },
            { $sort: { createAt: -1 } },
            // { $limit: 1 },
            {
              $project: {
                _id: 1,
                from: 1,
                to: 1,
                msg: 1,
                createAt: 1,
                status: 1
              }
            }
          ],
          as: 'ultimoMensaje'
        }
      },
      // Agrupamos los mensajes por contacto
      {
        $group: {
          _id: '$_id',
          contactos: {
            $push: {
              _id: '$contactos._id',
              username: '$contactos.username',
              state: '$contactos.state',
              ultimaConexion: '$contactos.ultimaConexion',
              ultimoMensaje: {
                $arrayElemAt: ['$ultimoMensaje', 0]
              },
              mensajesNoLeidos: {
                $reduce: {
                  input: '$ultimoMensaje',
                  initialValue: 0,
                  in: {
                    $add: [
                      '$$value',
                      {
                        $cond: [
                          {
                            $eq: ['$$this.status', 'unread']
                          },
                          1,
                          0
                        ]
                      }
                    ]
                  }
                }
              }
            }
          }
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
