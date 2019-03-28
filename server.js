var express = require("express");
var logger = require("morgan");
var mongoose = require("mongoose");
var axios = require("axios");
var cheerio = require("cheerio");
require("dotenv").config();

var db = require("./models");

var PORT = process.env.PORT || 3000;

var app = express();



// Use morgan logger for logging requests
app.use(logger("dev"));

var MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost/mongoHeadlines";

mongoose.connect(MONGODB_URI)
.then(() => {
    console.log('Successfully connected to Mongo database');
})
.catch(err => {
    console.error(err);
});

// Parse application body as JSON
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
// Serve static content for the app from the "public" directory in the application directory.
app.use(express.static("public"));

// Set Handlebars.
var exphbs = require("express-handlebars");

app.engine("handlebars", exphbs({ defaultLayout: "main" }));
app.set("view engine", "handlebars");


// main page route
app.get('/', function (req, res) {
  db.Article.find({ saved: false })
    .then(function (dbArticles) {
      let hbsObject = {
        articles: dbArticles
      };
      res.render('index', hbsObject)
    })
    .catch(err => {
        console.log(err);
    });
});

// route to scrape site
app.get("/scrape", function(req, res) {
  axios.get("https://www.npr.org/sections/news/").then(function(response) {

    var $ = cheerio.load(response.data);

    $("article div.item-info").each(function(i, element) {

      var result = {};

      result.title = $(this).children("h2").text();

      result.link = $(this).children("h2").children("a").attr("href");
      
      result.summary = $(this).children("p").text();

      console.log(result);
      db.Article.create(result)
        .then(function(dbArticle) {
          console.log(dbArticle);
        })
        .catch(function(err) {
          console.log(err);
        });
    });

    // Send a message to the client
    res.send("Scrape Complete");
  });
});

// Start our server so that it can begin listening to client requests.
app.listen(PORT, function() {
  // Log (server-side) when our server has started
  console.log("Server listening on: http://localhost:" + PORT);
});
