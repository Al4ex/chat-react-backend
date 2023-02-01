import User from "../models/user";
import Contact from "../models/Contacts";

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

const getUsers = async () => {
  try {
    const users = await User.aggregate([
 {$lookup: {
           from: "messages",
           let: {
             uid: "$_id",
           },
           pipeline: [
             {
               $match: {
                 $expr: {
                   $or: [{ $eq: ["$to", "$$uid"] }, { $eq: ["$from", "$$uid"] }],
                 },
               },
             },
             
             
             { $sort: { createAt: -1 } }, // add sort if needed (for example, if you want first 100 comments by creation date)
             { $limit: 1 },
           ],
           as: "final",
         },}
    ]).sort("-updatedAt");
    if (users.length > 0) {
      return users;
    } else {
      return null;
    }
  } catch (error) {
    return null;
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
