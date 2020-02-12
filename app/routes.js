const locationScan = require('./modules/locationScan.js');
const offersApi = require('./modules/offersApi.js');
const uaParser = require('./modules/uaParser.js');

module.exports = function (app) {

    const mws = require('./modules/mws.js')(app)

    app.get('/transaction', locationScan.check, offersApi.getTransactionId)

    app.get('/*', mws.languageRedirects, locationScan.check, mws.setPrices, mws.setCurrency, mws.setSticker, mws.getLink, uaParser, function (req, res) {
        
        console.log("Page Name: " + req.pageName)
        console.log("HOST: " + req.hostname)

        offersApi.impressionPixel(req)

        res.render('pages/' + req.pageName + '.ejs' , {
            userAgent: req.userAgent
        });
            

    })

    // handle 404/Other Error
    app.use(function(err, req, res, next) {
        mws.show404(err, req, res, next)
    });

};