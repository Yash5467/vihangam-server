
import mongoose from "mongoose";

export const connectDB = () => {
  const mongoURL = process.env.MONGO_URL!;
  mongoose
    .connect(mongoURL)
    .then((c) => {
      console.log(`Connected with ${c.connection.name}`);
    })
    .catch((e) => console.log(e));
}

