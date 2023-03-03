
import User from "../models/user";
export const createUserAdmin = async () => {

    
    const user = new User({
        username: "Alexander Cruz",
        email: process.env.EMAIL,
        password: process.env.PASS,
    });
    
    
    try {
        const findUser = await User.findOne({ email: user.email });
    
        if (findUser) {
          console.log("User already exists");
        } else {
          user.password = await user.encryptPassword(user.password);
          const savedUser = await user.save();
          console.log(savedUser);
        }
      } catch (error) {
        console.log(error);
      }

  };