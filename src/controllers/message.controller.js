import Message from "../models/Message";

const sendMessage = async (data) => {
  const { to, from, msg } = data;
  let message = new Message({ to, from, msg });

  try {
    const response = await message.save();

    // res.status(200).send({ message: result, status: "succes" });
    return response;
  } catch (error) {
    return false;
    // res.status(500).send({ message: "error en el servidor", status: "error" });
  }
};

const getChat = async (req, res) => {
  const { id } = req.user;
  const messageFrom = req.params.from;
  const listMessages = await Message.find({
    $or: [
      { from: id, to: messageFrom },
      { from: messageFrom, to: id },
    ],
  }).sort({ createAt: "asc" });
  console.log(listMessages);
  res.status(200).send({ ok: true, userId: id, messages: listMessages });
};

const updateMessage = async (req, res) => {
  const { to, from } = req;
  // console.log(to, from, "alex");
  try {
    const updateTo = await Message.updateMany({ to, from }, { status: "read" });
    return updateTo
  } catch (error) {
    console.log(error);
  }
};

export { getChat, sendMessage, updateMessage };
