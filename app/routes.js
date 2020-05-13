const locationScan = require('./modules/locationScan.js');
const offersApi = require('./modules/offersApi.js');
const uaParser = require('./modules/uaParser.js');
const {langs} = require('./json/langs.json');

module.exports = function (app) {

    const mws = require('./modules/mws.js')(app)


    app.get(['/devices', '/devices-:os'
            ], mws.languageRedirects, locationScan.check, mws.setPrices, mws.setCurrency, mws.setSticker, mws.getLink, uaParser, mws.getDevices, function (req, res) {
            
            // console.log("device: " + req.os.name)
            console.log("Page Name: " + req.pageName)
            console.log("HOST: " + req.hostname)
    
            offersApi.impressionPixel(req)
    
            res.render('pages/devices.ejs' , {
                userAgent: req.userAgent,
                device: req.os,
                trustScore: app.liveData.Trustpilot.trustScore,
                stars: app.liveData.Trustpilot.trustStars,
                numberOfReviews: app.liveData.Trustpilot.trustNumberOfReviews,
                langReviews: app.liveData.Trustpilot.trustpilotReviews[langs[req.lang]],
                
                serversCount: app.liveData.servers.serversCount,
                countriesCount: app.liveData.servers.countriesCount
            });
        
    })


    app.get(['/transaction', '/offer/transaction'], locationScan.check, offersApi.getTransactionId)

    app.get(['/best-vpn-:geo([a-z]{2})',
        '/best-vpn',
    ], mws.languageRedirects, locationScan.check, mws.setPrices, mws.setCurrency, mws.setSticker, mws.getLink, uaParser, mws.getBestCountry, function (req, res) {
        console.log("GEO: " + req.params.geo)
        console.log("Page Name: " + req.pageName)
        console.log("HOST: " + req.hostname)
        
        offersApi.impressionPixel(req)

        res.render('pages/best-vpn.ejs', {
            userAgent: req.userAgent,
            trustScore: app.liveData.Trustpilot.trustScore,
            stars: app.liveData.Trustpilot.trustStars,
            numberOfReviews: app.liveData.Trustpilot.trustNumberOfReviews,
            langReviews: app.liveData.Trustpilot.trustpilotReviews[langs[req.lang]],

            serversCount: app.liveData.servers.serversCount,
            countriesCount: app.liveData.servers.countriesCount
        });

    })

    app.get('/youtube', mws.languageRedirects, locationScan.check, mws.setPrices, mws.setChannels, mws.setCurrency, mws.setSticker, mws.getLink, uaParser, function (req, res) {
        
        console.log("Page Name: " + req.pageName)
        console.log("HOST: " + req.hostname)
        console.log("channels: " + req.channels)

        offersApi.impressionPixel(req)

        res.render('pages/' + req.pageName + '.ejs' , {
            userAgent: req.userAgent,
            trustScore: app.liveData.Trustpilot.trustScore,
            stars: app.liveData.Trustpilot.trustStars,
            numberOfReviews: app.liveData.Trustpilot.trustNumberOfReviews,
            langReviews: app.liveData.Trustpilot.trustpilotReviews[langs[req.lang]],

            serversCount: app.liveData.servers.serversCount,
            countriesCount: app.liveData.servers.countriesCount
        });
            

    })

    app.get('/*', mws.languageRedirects, locationScan.check, mws.setPrices, mws.setCurrency, mws.setSticker, mws.getLink, uaParser, function (req, res) {
        
        console.log("Page Name: " + req.pageName)
        console.log("HOST: " + req.hostname)
        console.log(`langs[req.lang]: ${langs[req.lang]}`)
        offersApi.impressionPixel(req)

        res.render('pages/' + req.pageName + '.ejs' , {
            userAgent: req.userAgent,
            trustScore: app.liveData.Trustpilot.trustScore,
            stars: app.liveData.Trustpilot.trustStars,
            numberOfReviews: app.liveData.Trustpilot.trustNumberOfReviews,
            langReviews: app.liveData.Trustpilot.trustpilotReviews[langs[req.lang]],

            serversCount: app.liveData.servers.serversCount,
            countriesCount: app.liveData.servers.countriesCount
        });
            

    })

    // handle 404/Other Error
    app.use(function(err, req, res, next) {
        mws.show404(err, req, res, next)
    });

};