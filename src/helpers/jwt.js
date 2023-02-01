import jwt from "jsonwebtoken";
import moment from "moment";

export const createToken = (user) => {
  const payload = {
    id: user.id,
    // username: user.username,
    // email: user.email,
    // telefono: user.telefono,
    // bio: user.bio,
    // facebook: user.facebook,
    // twitter: user.twitter,
    // imagen: user.imagen,
    // state: user.state,
    iat: moment().unix(),
    exp: moment().add(2, "days").unix(),
  };
  return jwt.sign(payload, process.env.SECRET_KEY);
};

export const checkToken = (token = "") => {
  try {
    const { id } = jwt.verify(token, process.env.SECRET_KEY);
    return [true, id];
  } catch (error) {
    return [false, null];
  }
};
