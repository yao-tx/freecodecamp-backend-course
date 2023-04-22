const express = require("express");
const app = express();
const cors = require("cors");
const mongoose = require("mongoose");
require("dotenv").config();

// Connect to MongoDB database
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
const connection = mongoose.connection;
connection.on("error", console.error.bind(console, "connection error:"));
connection.once("open", () => {
  console.log("MongoDB database connection established successfully");
});

const Schema = mongoose.Schema;

const userSchema = new Schema({ 
  username: {
    type: String,
    unique: true,
  }
});

const exerciseSchema = new Schema({
  username: String,
  description: String,
  duration: Number,
  date: String,
  userId: String
});

const User = mongoose.model("User", userSchema);
const Exercise = mongoose.model("Exercise", exerciseSchema);

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

app.get("/api/users", async (req, res) => {
  const findUsers = await User.find();
  res.json(findUsers);
});

app.post("/api/users", async (req, res) => {
  const username = req.body.username;

  if (typeof username === "undefined" || username === "") {
    res.json({ error: "username required" });
  }

  const findUser = await User.findOne({ username: username });

  if (findUser) {
    res.json({
      username: findUser.username,
      _id: findUser._id
    });
  } else {
    const newUser = new User({ username: username });
    newUser.save()
      .then(() => {
        res.json({
          username: newUser.username,
          _id: newUser._id
        });
      });  
  }
});

app.post("/api/users/:_id/exercises", async (req, res) => {
  const description = req.body.description;
  let duration = req.body.duration;
  let date = req.body.date;
  const _id = req.params._id;
  duration = parseInt(duration);

  // if (isNaN(duration) || !Number.isInteger(duration)) return res.json({ error: "duration should be integer!" });
  // if (!userId) return res.json({ error: "user id required!" });
  // if (!description) return res.json({ error: "description required!" });
  // if (!duration) return res.json({ error: "duration required!" });
  if (!date) {
    date = new Date(Date.now());
  } else if (!/^\d{4}\-(0?[1-9]|1[012])\-(0?[1-9]|[12][0-9]|3[01])$/.test(date)) {
    return res.json({ error: "invalid date!" });
  } else {
    date = new Date(date);
  }

  try {
    const findUser = await User.findById(_id);

    const newExercise = new Exercise({
      username: findUser.username,
      description: description,
      duration: duration,
      date: date.toISOString(),
      userId: findUser._id
    });
    
    newExercise.save()
      .then(() => {
        //if (data) {
          return res.json({
            username: findUser.username,
            description: description,
            duration: parseInt(duration),
            date: date.toDateString(),
            _id: _id,
          });
        //}
      });
  } catch (err) {
    console.error(err);
    return res.json({ error: "user not found" });
  }
});

app.get("/api/users/:_id/logs", async (req, res) => {
  const _id = req.params._id;
  const { from, to, limit } = req.query;

  let dateFilter = {};

  if (typeof from !== "undefined") dateFilter["$gte"] = new Date(from).toISOString();
  if (typeof to !== "undefined") dateFilter["$lte"] = new Date(to).toISOString();

  // if (!userId) res.json({ error: "invalid request" });

  try {
    const findUser = await User.findById(_id);

    let filter = {
      userId: findUser._id
    };
  
    if (to || from) {
      filter.date = dateFilter;
    }

    let findExercises;

    if (typeof limit !== "undefined") {
      findExercises = await Exercise.find(filter).limit(parseInt(limit));
    } else {
      findExercises = await Exercise.find(filter);
    }
  
    findExercises = findExercises.map((e) => {
      return {
        description: e.description,
        duration: e.duration,
        date: new Date(e.date).toDateString()
      };
    });
  
    res.json({
      username: findUser.username,
      count: findExercises.length,
      _id: findUser._id,
      log: findExercises
    });  
  } catch(err) {
    console.error(err);
    // res.json({ error: "user not found" });
  }
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
});