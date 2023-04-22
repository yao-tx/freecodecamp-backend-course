// index.js
// where your node app starts

// init project
var express = require('express');
var app = express();

// enable CORS (https://en.wikipedia.org/wiki/Cross-origin_resource_sharing)
// so that your API is remotely testable by FCC 
var cors = require('cors');
app.use(cors({optionsSuccessStatus: 200}));  // some legacy browsers choke on 204

// http://expressjs.com/en/starter/static-files.html
app.use(express.static('public'));

// http://expressjs.com/en/starter/basic-routing.html
app.get("/", function (req, res) {
  res.sendFile(__dirname + '/views/index.html');
});

app.get("/api", (req, res) => {
  let resDate = new Date();

  res.json({ unix: resDate.valueOf(), utc: resDate.toUTCString() });
});

app.get("/api/:timestamp", (req, res) => {
  let timestamp = req.params.timestamp;
  
  if (typeof timestamp === "undefined") {
    res.json({ error: "Invalid Date" });
  } else {
    if (/\d{5,}/.test(timestamp)) {
      timestamp = parseInt(timestamp);
    }

    let resDate = new Date(timestamp);

    if (resDate.toUTCString() == "Invalid Date") {
      res.json({ error: "Invalid Date" });
    } else {
      res.json({ unix: resDate.valueOf(), utc: resDate.toUTCString() });
    }
  }
});



// listen for requests :)
var listener = app.listen(process.env.PORT, function () {
  console.log('Your app is listening on port ' + listener.address().port);
});
