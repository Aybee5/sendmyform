const express = require("express");
const path = require("path");
const multer = require("multer");
const cors = require("cors");
const bodyParser = require("body-parser");
const nodemailer = require("nodemailer");
const { unlinkSync } = require("fs");

const PORT = process.env.PORT || 3000;

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },

  // By default, multer removes file extensions so let's add them back
  filename: function (req, file, cb) {
    cb(null, req.body.name + path.extname(file.originalname));
  },
});

const app = express();

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

const upload = multer({ storage: storage });

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.post("/single", upload.single("image"), (req, res) => {
  const body = req.body;
  function mailBody() {
    let htmlBody = [];
    for (let [key, value] of Object.entries(body)) {
      if (key === "devuser") {
        continue;
      } else {
        htmlBody.push(`${key.toUpperCase()} - ${value}\n`);
      }
    }
    htmlBody.forEach((content) => {
      return `<p> ${content} </p>`;
    });
    if (req.file) {
      return htmlBody;
      // return {htmlBody, html:`Embedded Image: <img src="cid:unique@formmailer.com"`}
    }
    return htmlBody;
  }
  console.log(mailBody().toString().split(",").join(""));
  let mailTo = body.devuser;
  let smtpTransport = nodemailer.createTransport({
    // host: 'smtp.mailtrap.io',
    // port: 2525,
    // auth: {
    //   user: '',
    //   pass: ''
    // }
  });
  let mailOptions = {
    from: "dev@hooli.ng",
    to: mailTo,
    subject: `${req.body.name}'s submission`,
    html:
      // we're converting the mail body to string and since node doesn't yet support replaceAll, we use split and join
      `${mailBody().toString().split(",").join("")}`
  };
  if (req.file) {
    mailOptions.attachments = [
      {
        filename: req.file.filename,
        path: req.file.path,
        cid: "unique@formmailer.com",
      },
    ];
  }
  smtpTransport
    .sendMail(mailOptions)
    .then((result) => {
      res.status(201).json({ msg: "success", res: result });
    })
    .catch((err) => {
      res.status(500).json({ err: "error", error: err });
    })
    .finally(() => {
      smtpTransport.close();
      // deletes file from server
      unlinkSync(req.file.path);
    });
});
const listener = app.listen(PORT, () => {
  console.log(`Application is listening on port ${listener.address().port}`);
});
