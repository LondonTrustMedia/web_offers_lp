const request = require("request");
const async = require("async");
const humanizeDuration = require('humanize-duration')

const trustpilotApi = (module.exports = {
  getData: function(callback) {
    options = {
      method: "GET",
      uri: "https://api.trustpilot.com/v1/business-units/4fc92496000064000515f77d?apikey=2ftJoGSBnThwG0zvFIKbhppNLoGAEAbS"
    };

    request.get(options, function(err, response, body) {
      if (err || !body || response.statusCode !== 200) {
        if (response) console.log("response status code:", response.statusCode);
        console.log("can't get user trustpilot data:");
        callback(err || body || response);
      } else {
        const data = JSON.parse(body);

        var trustScore = data.score.trustScore || 5;
        var stars = data.score.stars || 5;
        var numberOfReviews = data.numberOfReviews.total || 8921;

        console.log("trustScore: " + trustScore);
        console.log("stars: " + stars);
        console.log("numberOfReviews: " + numberOfReviews);

        // req.trustScore = trustScore;
        // req.stars = stars;
        // req.numberOfReviews = numberOfReviews;
        // callback();
        
        callback(null, trustScore, stars, numberOfReviews);
      }
    });
  },
  getReviews: function(callback) {

    

    var langs = [
      "es",
      "fr",
      "it",
      "nl",
      "de",
      "pt",
      "ru",
      "ja",
      "dk",
      "no"
    ];

    var langReviews = {};
    getReview("en", (err, reviews) => {
        if (err) {
            console.log(err)
            callback(err)
        } else {
            langReviews["en"] = reviews
            async.forEach(langs, (lang, next) => {
                getReview(lang, (err, reviews) => {
                    if (err) {
                        console.log(err)
                        callback(err)
                    } else {
                        langReviews[lang] = reviews
                        if (reviews.length < 20) 
                            langReviews[lang] = langReviews[lang].concat(langReviews["en"].slice(0, 20 - langReviews[lang].length));
                        next()
                    }
                })
            }, err => {
                if (err) {
                    console.error(err);
                    callback(err);
                } else {
                    // console.log("langReviews:" + JSON.stringify(langReviews, null, 4));
                    console.log("got TrustPilot's reviews successfully")
                    callback(null, langReviews);
                }
            });
        }

    })


   
  }
});


function getReview(lang, callback) {
    var options = {
        method: "GET",
        uri:
          "https://api.trustpilot.com/v1/business-units/4fc92496000064000515f77d/reviews?apikey=2ftJoGSBnThwG0zvFIKbhppNLoGAEAbS&stars=5&language=" + lang
      };

      request.get(options, function(err, response, body) {
        if (err || !body || response.statusCode !== 200) {
          if (response)
            console.log("response status code:", response.statusCode);
          console.log("can't get user trustpilot data:");
          callback(err || body || response);
        } else {
          // console.log(JSON.stringify(JSON.parse(body), null, 4))

          var reviews = JSON.parse(body).reviews;

          reviews = reviews.filter(
            review =>
              review.text.length < 120 &&
              !review.title.includes("@") &&
              review.title.length < 60
          );

          reviews = reviews.map(review => {
            timeDifference = Date.parse(new Date()) - Date.parse(review.createdAt);
            

            return {
              name: review.consumer.displayName,
              title: review.title,
              text: review.text,
              lang: review.language,
              time: humanizeDuration(timeDifference, { largest: 1, language: lang, fallbacks: ['en'], round: true })
            };
          });
          callback(null, reviews)
        }
    });
}