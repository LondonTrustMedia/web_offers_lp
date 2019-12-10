const locationScan = require('./modules/locationScan.js');
const offersApi = require('./modules/offersApi.js');
const prices = require('./json/prices.json');
const request = require('request');
const uaParser = require('./modules/uaParser.js');

module.exports = function (app) {

    const mws = require('./modules/mws.js')(app)

    app.get('/transaction', function (req, res) {
        var userAgent = req.header('User-Agent')
        if (req.ip === "::1" || req.ip === "127.0.0.1") var userIP = '81.180.227.170'
        else userIP = req.ip.replace(/::ffff:/, '')

        const options = {
            url: 'https://ho-app.kape.com/aff_c' + req.search,
            followRedirect: false,
            headers: {
              'User-Agent': userAgent,
              'X-Forwarded-For': userIP,
              
            }
        };

        // console.log(options)
        request.get( options, function(err, response, body){
            if (err || !body) {
                console.log('Error Getting Transaction ID from HasOffers')
                console.log(err)
                res.json({
                    "status": false,
                    "error": err
                }).end()
            } else {
                // console.log('response.headers --------------------->')
                // console.log(response.headers)
                if (response.headers['tracking_id'])
                    res.json({
                        "status": true,
                        "transactionId": response.headers['tracking_id']
                    }).end()
                else 
                    res.json({
                        "status": false,
                        "error": body
                    }).end()
            }
        })
    })

    app.get('/*', locationScan.check, offersApi.getLink, mws.setPrices, mws.setCurrency, mws.setSticker, uaParser, function (req, res) {
        
        console.log("Page Name: " + req.pageName)
        console.log("HOST: " + req.hostname)

        // console.log("User Location Details: ")
        // console.log(req.userLocation)

        offersApi.impressionPixel(req)

        res.render('pages/' + req.pageName + '.ejs' , {
            userAgent: req.userAgent
        });
            

    })

    // handle 404/Other Error
    app.use(function(err, req, res, next) {
        mws.show404(err, req, res, offersApi)
    });

};