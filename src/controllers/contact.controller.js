import Contact from "../models/Contacts";
import User from "../models/user";
import Message from "../models/Message";

const saveContact = async (req, res) => {
  let data = [];
  const { email, owner } = req.body;

  try {
    const userFindind = await User.findOne({ email });
    if (!userFindind) {
      return res
        .status(404)
        .send({ ok: false, message: "El usuario NO EXISTE" });
    }
    let contactFind = await Contact.find({
      owner: [owner, userFindind._id],
    });
    if (contactFind.length == 2) {
      const validateArr = await Contact.find({
        contact: { $in: [userFindind._id, owner] },
        owner: [owner, userFindind._id],
      });
      data = [
        { owner: userFindind._id, contact: owner },
        {
          owner,
          contact: userFindind._id,
        },
      ];
      let toUupdate = (contact) => ({
        updateOne: {
          filter: { owner: contact.owner },
          update: {
            $push: { contact: contact.contact },
          },
        },
      });

      if (validateArr.length == 0) {
        const update = await Contact.bulkWrite(data.map(toUupdate));

        return res.status(200).send({
          ok: true,
          message: "El contacto ha sido agregado correctamente",
          update,
        });
      }
      return res.status(409).send({
        ok: false,
        message: "El contacto ya existe",
        validateArr,
      });
    }
    /**
     * si solo existe un contacto
     */
    if (contactFind.length == 1) {
      let newContact = {};
      if (contactFind[0].owner == owner) {
        console.log(contactFind[0].owner);
        data = [
          {
            owner,
            contact: userFindind._id,
          },
        ];
        newContact = {
          contact: owner,
          owner: userFindind.id,
        };
      } else {
        data = [
          {
            owner: userFindind._id,
            contact: owner,
          },
        ];
        newContact = {
          owner: owner,
          contact: userFindind.id,
        };
      }
      const validateArr = await Contact.find({
        contact: { $in: [userFindind._id, owner] },
        owner: [owner, userFindind._id],
      });

      let toUupdate = (contact) => ({
        updateOne: {
          filter: { owner: contact.owner },
          update: {
            $push: { contact: contact.contact },
          },
        },
      });

      if (validateArr.length == 0) {
        const update = await Contact.bulkWrite(data.map(toUupdate));
        let newContactData = new Contact(newContact);

        const resp = await newContactData.save();
      }

      return res.status(409).send({
        ok: false,
        message: "El contacto ya existe",
        validateArr,
      });
    }

    // const contactFind2 = await Contact.findOne({ owner: userFindind._id });
    // if (contactFind2) {
    //   const validateArr = await Contact.find({
    //     contact: { $in: [owner] },
    //   });
    //   if (validateArr.length == 0) {
    //     const updateData = await Contact.updateOne(
    //       { owner: userFindind._id },
    //       {
    //         $push: { contact: owner },
    //       }
    //     );

    //     return res.status(200).send({
    //       ok: true,
    //       message: "El contacto ha sido agregado correctamente",
    //       validateArr,
    //     });
    //   }
    //   return res.status(409).send({
    //     ok: false,
    //     message: "El contacto ya existe",
    //     validateArr,
    //   });
    // }

    // let newContact = new Contact({ contact: userFindind.id, owner });

    // const resp = await newContact.save();

    // let newContact2 = new Contact({ contact: owner, owner: userFindind.id });

    const resp2 = await Contact.insertMany([
      { contact: userFindind.id, owner },
      { contact: owner, owner: userFindind.id },
    ]);
    console.log(resp2);
    return res.status(200).send({ ok: true, resp2 });
  } catch (error) {
    console.log(error);
  }
};
const gedContacts = async (req, res) => {
  const { email, owner } = req.body;

  try {
    const userFindind = await Contact.aggregate([
      {
        $lookup: {
          from: "Users",
          let: {
            listContact: "$contact",
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $in: ["$_id", "$$listContact"],
                },
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

    // const resp = await newContact.save();
    return res.status(200).send({ userFindind });
  } catch (error) {
    console.log(error);
  }
};

export { saveContact, gedContacts };
