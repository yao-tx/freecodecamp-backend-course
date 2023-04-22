require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const mongoose = require("mongoose");
const shortId = require("shortid");
const validUrl = require("valid-url");
const dns = require("node:dns");

// Basic Configuration
const port = process.env.PORT || 3000;
// Connect to MongoDB database
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
const connection = mongoose.connection;
connection.on("error", console.error.bind(console, "connection error:"));
connection.once("open", () => {
  console.log("MongoDB database connection established successfully");
});

const Schema = mongoose.Schema;
const urlSchema = new Schema({
  original_url: String,
  short_url: String
});
const UrlModel = mongoose.model("URL", urlSchema);

async function dnsLookup(string) {
  const urlObject = new URL(string);

  return new Promise((resolve, reject) => {
    dns.lookup(urlObject.hostname, (err, address, family) => {
      if (err) reject(false);
      resolve(true);
    });
  });
}

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/public', express.static(`${process.cwd()}/public`));
app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.post("/api/shorturl", async (req, res) => {
  let originalUrl = req.body.url;

  if (typeof originalUrl === "undefined" || !validUrl.isWebUri(originalUrl) || await !dnsLookup(originalUrl)) {
    console.log(originalUrl);
    res.json({ error: 'invalid url' });
  } else {
    try {
      const findOriginalUrl = await UrlModel.findOne({ original_url: originalUrl });

      if (findOriginalUrl) {
        res.json({
          original_url: findOriginalUrl.original_url,
          short_url: findOriginalUrl.short_url
        });
      } else {
        let uniqueId = shortId.generate();
  
        const newUrl = new UrlModel({
          original_url: originalUrl,
          short_url: uniqueId
        });
  
        newUrl.save()
          .then(() => {
            res.json({
              original_url: newUrl.original_url,
              short_url: newUrl.short_url
            });
          });
      }
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "server error" });
    }
  }
});

app.get("/api/shorturl/:shortUrl", async (req, res) => {
  try {
    const findShortUrl = await UrlModel.findOne({ short_url: req.params.shortUrl });

    if (findShortUrl) {
      return res.redirect(findShortUrl.original_url);
    } else {
      return res.status(400).json({ error: "invalid url" });
    }
  } catch(err) {
    console.error(err);
    res.status(500).json({ error: "server error" });
  }
})

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});