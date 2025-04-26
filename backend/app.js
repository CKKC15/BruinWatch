import express from "express";
import connectDB from "./db/mongo.js";
import userRoute from "./routes/userRoute.js";
import videoRoute from "./routes/videoRoute.js";
import User from "./models/user.js";
import bcrypt from "bcryptjs";
import session from 'express-session';


const app = express();
const port = 3000;


// middleware
app.use(express.json());
app.use(session({
  secret: "keyboard cat",
  maxAge: 20 * 60 * 1000,
}))

// basic root route
app.get("/", (req, res) => {
  return res.status(200).json("Hello world");
});

/* 
  Method to find all the users
*/ 
app.get("/users", async(req, res) => {
  const users = await User.find(); 
  return res.status(200).json(users);
});


app.post("/register", async (req, res) => {
  const { name, password } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const new_user = await User.create({
      name: name,
      password: hashedPassword,
    });

    return res.status(200).json("User successfully created: " + new_user);
  } catch (error) {
    return res.status(500).json(error.message);
  }
});

app.post("/login", async (req, res) => {
  const { name, password } = req.body;
  if (req.session.user) {
    return res.status(500).json("Already logged in as: " + req.session.user);
  }
  try {
    const user = await User.findOne({ name });
    if (!user) {
      return res.status(500).json("Account with the username not found");
    }
    // console.log(user.password + ', ' + password);
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(500).json("Password not correct");
    }
    req.session.user = user;
    req.session.save();

    return res.status(200).json("Succesfully loggedin");
  } catch (error) {
    res.status(500).json(error.message);
  }
});

// routes
app.use("/users", userRoute);
app.use("/videos", videoRoute);

// start server and connect to db
app.listen(port, async () => {
  try {
    await connectDB();
    console.log(`Server is running on port ${port}`);
  } catch (err) {
    console.error("Database connection failed", err);
    process.exit(1);
  }
});
