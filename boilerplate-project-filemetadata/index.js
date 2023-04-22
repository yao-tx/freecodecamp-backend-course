const express = require('express');
const cors = require('cors');
const fileUpload = require('express-fileupload');
require('dotenv').config()

const app = express();

app.use(cors());
app.use(fileUpload());
app.use('/public', express.static(process.cwd() + '/public'));

app.get('/', function (req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

app.post("/api/fileanalyse", (req, res) => {
    if (!req.files || Object.keys(req.files).length === 0) {
      return res.status(400).json({
        error: "No file was uploaded!"
      });
    }
  
    let uploadedFile = req.files.upfile;

    return res.json({
      name: uploadedFile.name,
      type: uploadedFile.mimetype,
      size: uploadedFile.size
    });
});


const port = process.env.PORT || 3000;
app.listen(port, function () {
  console.log('Your app is listening on port ' + port)
});
