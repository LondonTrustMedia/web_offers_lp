const moment = require('moment');
const fs = require('fs');
const norobot = require('norobot');
const prices = require('./../json/prices.json');
const slackApi = require('./slackApi.js');
const path = require('path')
const cs = require('checksum');
let event = getEvent()

let cache = [];

// setInterval(() => {
//     event = getEvent()
// }, 60000);

module.exports = (app) => {

    const middleWares = {
        setVariables: (req, res, next) => {
            res.locals.query = req.query
            res.locals.urlSearch = req.search = req.url.split('?').length > 1 ? '?' + req.url.split('?')[1] : "?"
            req.fixedHost = fixedHost + 'offer/'
            res.locals.urlForLang = (fixedHost  + req.originalUrl).replace(/^.*privateinternetaccess.com/g, 'privateinternetaccess.com').replace(/^.*pialocal.com/g, 'pialocal.com')
            res.locals.pageName = req.pageName = req.path.replace('/offer', '').replace('/amp', '').slice(1).replace('.html', '').replace('.HTML', '').replace(/\/$/, '')
            res.locals.path = req.path
            res.locals.event = req.event = event
            // if (event && event.coupon)
            //     middleWares.forceCoupon(event.coupon, req, res)
            next()
        },

        forceCoupon: (coupon, req, res) => {
            req.forceCoupon = coupon

            console.log('req.aff_id', req.query.aff_id)

            if ((req.query.aff_id && !affFilter.includes(req.query.aff_id)) || !req.query.aff_id) {
                if (req.query.coupon && req.query.coupon !== coupon) {
                    var regex = new RegExp(req.query.coupon, 'g')
                    res.locals.urlSearch = req.search = req.search.replace(regex, coupon)
                    res.locals.query.coupon = req.query.coupon = coupon
                } else if (!req.query.coupon){
                    res.locals.query.coupon = req.query.coupon = coupon
                    res.locals.urlSearch = req.search = req.search + '&coupon=' + coupon
                }
            }
        },

        getLink: function(req, res, next){
            switch (req.lang) {
                case 'deu':
                    res.locals.offerLink = req.offerLink = 'https://deu.privateinternetaccess.com/pages/jetzt-kaufen/' + (req.query && req.query.coupon ? req.query.coupon : '')
                    break;
            
                case 'fra':
                    res.locals.offerLink = req.offerLink = 'https://fra.privateinternetaccess.com/pages/acheter-maintenant/' + (req.query && req.query.coupon ? req.query.coupon : '')
                    break;
                    
                default:
                    res.locals.offerLink = req.offerLink = 'https://www.privateinternetaccess.com/pages/buy-now/' + (req.query && req.query.coupon ? req.query.coupon : '')
                    break;
            }
                
            next()
        },


        languageRedirects: (req, res, next) => {
            var options = {
                domain: process.env.NODE_ENV === 'local' ? '.pialocal.com' : '.privateinternetaccess.com',
                maxAge: 1000 * 60 * 60 * 24 * 30, // would expire after 30 days
                httpOnly: true, // The cookie only accessible by the web server
                signed: true // Indicates if the cookie should be signed
            }
        
            var cookie = req.signedCookies['pia_lang'];
            var noLangInUrl = req.subdomains.length === 0
            // console.log('cookie', cookie)
            console.log('URL', req.originalUrl)
        
            console.log('noLangInUrl', noLangInUrl)
            console.log('cookie', cookie)
            console.log('req.lang', req.lang)
            console.log('req.get(\'host\')', fixedHost )
            if (noLangInUrl && cookie !== undefined && cookie !== 'eng') {
                // If lang cookie found
                console.log('Found Cookie - Redirecting to', req.protocol + '://' + cookie + '.' + fixedHost  + req.originalUrl)
                res.redirect(req.protocol + '://' + cookie + '.' + fixedHost + req.originalUrl)
                return;
            } else if (noLangInUrl && req.lang !== 'eng') {
                    console.log('Adding locale to the URL - Redirecting to', req.protocol + '://' + cookie + '.' + fixedHost  + req.originalUrl)
                    res.redirect(req.protocol + '://' + req.lang + '.' + fixedHost  + req.originalUrl)
            }  else { 
                console.log(req.path)
                res.cookie('pia_lang', req.lang, options);
                console.log('cookie created successfully with value: ' + req.lang);
                next()
            }
        },

        rotatorIdCheck: (req, res, next) => {

            var rotatorId = req.pageName.split('%3F')[0].split('%20')[0].split('&')[0].split('/')
            rotatorId = rotatorId[rotatorId.length - 1]
            const matchKey = Object.keys(app.rotators).find(key => key.toLowerCase() === rotatorId.toLowerCase())

            if (matchKey) {
                console.log('Detected rotator ID:', matchKey)
                const rotator = app.rotators[matchKey]
                let redirectOffer
                let totalWeight = rotator.totalWeight
                let newWeight = 100
                const randomNumber = Math.floor(Math.random() * 100) + 1

                try {
                    redirectOffer = rotator.offers.find(offer => {
                        newWeight = Math.floor(newWeight - ((offer.weight / totalWeight) * 100))
                        return (randomNumber > newWeight)
                    });
                } catch(err) {
                    next(err)  
                }

                if (!redirectOffer) redirectOffer = rotator.offers[0]

                let redirectLink = "" 
                if (redirectOffer.language && redirectOffer.language !== 'auto')
                    redirectLink = redirectOffer.link.replace('//privateinternetaccess.com', '//' + redirectOffer.language + 'privateinternetaccess.com')
                else
                    redirectLink = redirectOffer.link

                if (redirectLink.includes('?'))
                    redirectLink += '&' + req.search.slice(1)
                else
                    redirectLink += req.search

                res.redirect(redirectLink);
                
                // if (req.forceCoupon) {
                //     const oldCoupon = getParameterByName('coupon', redirectLink)
                //     const affId = getParameterByName('aff_id', redirectLink)
    
                //     if (oldCoupon && ((affId && !affFilter.includes(affId)) || !affId)) {
                //         var regex = new RegExp(oldCoupon, 'g')
                //         redirectLink = redirectLink.replace(regex, req.forceCoupon)
                //     } else {
                //         redirectLink += '&coupon=' + req.forceCoupon
                //     }
                //     redirectLink = removeDuplicatesInUrlParams(redirectLink, 'coupon')
                // }
        
            } else next()
        },

        setFakeCookie: (req, res, next) => {
            // check if client sent cookie
        
            const options = {
                httpOnly: true,
                signed: true,
                domain: '.privateinternetaccess.com',
                maxAge: (30 * 24 * 60 * 60 * 1000)
            }
        
            var cookie = req.signedCookies['PIALP_TRACKINGID'];
            if (cookie === undefined) {
        
                // no: set a new cookie
                randomNumber = Math.random().toString(11).substr(2, 18);
                res.cookie('PIALP_TRACKINGID', randomNumber, options);
                // console.log('\'CGLP_COOKIE\' cookie created successfully');
            }
            next();
        },

        setSticker: (req, res, next) => {

            // By Date
            // if (moment().isBetween("2019-11-26T16:00:00", "2019-11-26T20:30:00")){
            //     // console.log('true')
            //     res.locals.setSticker = req.setSticker = true
            //     next()
            // } else {
            //     // console.log('false')
            //     res.locals.setSticker = req.setSticker = false
            //     next()
            // }
        
            // By Location
            // console.log(req.userLocation.cn)
            // if (req.userLocation && req.userLocation.cn === 'France')
                // res.locals.setSticker = req.setSticker = true
            // else 
                // res.locals.setSticker = req.setSticker = false
                
            // always on    
            res.locals.setSticker = req.setSticker = false
        
            next()
        },

                // Set Currency
        setCurrency: (req, res, next) => {
            const eurCountries = [
                "Albania",
                "Andorra",
                "Armenia",
                "Austria",
                "Azerbaijan",
                "Belarus",
                "Belgium",
                "Bosnia and Herzegovina",
                "Bulgaria",
                "Croatia",
                "Cyprus",
                "Czech Republic",
                "Denmark",
                "Estonia",
                "Finland",
                "France",
                "Georgia",
                "Germany",
                "Greece",
                "Hungary",
                "Iceland",
                "Ireland",
                "Italy",
                "Kosovo",
                "Latvia",
                "Liechtenstein",
                "Lithuania",
                "Luxembourg",
                "Macedonia",
                "Malta",
                "Moldova",
                "Monaco",
                "Montenegro",
                "The Netherlands",
                "Norway",
                "Poland",
                "Portugal",
                "Romania",
                "Russia",
                "San Marino",
                "Serbia",
                "Slovakia",
                "Slovenia",
                "Spain",
                "Sweden",
                "Switzerland",
                "Turkey",
                "Ukraine",
                "United Kingdom",
                "Vatican City",
            ]

            // try {
            //     if ((req.userLocation.cn === "Russia" || req.userLocation.cn === "Ukraine") && isCurrencyExists(req.price, "RUB"))
            //         res.locals.currency = req.currency = {
            //             iso: "RUB",
            //             symbol: "руб",
            //             text: req.gettext('Russian Rubles')
            
            //         }
            //     else if (req.userLocation.cn === "India" && isCurrencyExists(req.price, "INR"))
            //         res.locals.currency = req.currency = {
            //             iso: "INR",
            //             symbol: "₹",
            //             text: req.gettext('Indian Rupee')
            
            //         }
            //     else if (req.userLocation.cn === "Brazil" && isCurrencyExists(req.price, "BRL"))
            //             res.locals.currency = req.currency = {
            //                 iso: "BRL",
            //                 symbol: "R$",
            //                 text: req.gettext('Brazilian Reals')
            //             }
            //     else if (req.userLocation.cn === "United Kingdom" && isCurrencyExists(req.price, "GBP"))
            //         res.locals.currency = req.currency = {
            //             iso: "GBP",
            //             symbol: "£",
            //             text: 'British Pounds Sterling'
            //         }
            //     else if (req.userLocation.cn === "Japan" && isCurrencyExists(req.price, "JPY"))
            //         res.locals.currency = req.currency = {
            //             iso: "JPY",
            //             symbol: "¥",
            //             text: req.gettext('Japanese Yen')
            
            //         }
            //     else if (req.userLocation.cn === "Australia" && isCurrencyExists(req.price, "AUD"))
            //             res.locals.currency = req.currency = {
            //                 iso: "AUD",
            //                 symbol: "AU$",
            //                 text: req.gettext('Australian Dollars')
            //             }
            //     else if (req.userLocation.cn === "Switzerland" && isCurrencyExists(req.price, "CHF"))
            //             res.locals.currency = req.currency = {
            //                 iso: "CHF",
            //                 symbol: "CHF",
            //                 text: req.gettext('Swiss Francs')
            //             }
            //     else if (eurCountries.includes(req.userLocation.cn))
            //         res.locals.currency = req.currency = {
            //             iso: "EUR",
            //             symbol: "€",
            //             text: req.gettext('Euros')
            //         }
            //     else if (usdCountries.includes(req.userLocation.cn))
            //         res.locals.currency = req.currency = {
            //             iso: "USD",
            //             symbol: "$",
            //             text: req.gettext('US Dollars')
            //         }
            //     else if (req.lang === 'de' ||
            //         req.lang === 'es' ||
            //         req.lang === 'fr' ||
            //         req.lang === 'it' ||
            //         req.lang === 'pl' ||
            //         req.lang === 'ro' ||
            //         req.lang === 'nl' ||
            //         req.lang === 'ko' )
            //         res.locals.currency = req.currency = {
            //             iso: "EUR",
            //             symbol: "€",
            //             text: req.gettext('Euros')
            //         }
            
            //     else 
            //         res.locals.currency = req.currency = {
            //             iso: "USD",
            //             symbol: "$",
            //             text: req.gettext('US Dollars')
            
            //         }
            // } catch (e) {
                // console.log(e)
                res.locals.currency = req.currency = {
                    iso: "USD",
                    symbol: "$",
                    text: req.gettext('US Dollars')
                }
            // }
            next()
        },

        setPrices: (req, res, next) => {

            res.locals.oldPrices = req.oldPrices = prices.original.main
            res.locals.prices = req.prices = prices.coupons.main

            if (req.query.price && prices.coupons[req.query.price])
                res.locals.prices = req.prices = prices.coupons[req.query.price]

            if (req.query.price && prices.original[req.query.price])
                res.locals.oldPrices = req.oldPrices = prices.original[req.query.price]
        
            next()
        },

        show404: (err, req, res, next) => {
            console.log(err)
            var query = req.query;
            slackApi.sendErrorMessage('404 Error', err || {content: 'Not Found'}, req)
            res.status(404);
            res.format({
                html: function () {
                    res.render('errors/404', { 
                        url: req.path,
                        pageName: '404',
                        query: query,
                        urlSearch: req.search
                    })
                },
                json: function () {
                    res.json({ error: 'Not found' })
                },
                default: function () {
                    res.type('txt').send('Not found')
                }
            })
        },
    
        versioning: (rootPath) => {
            var checksumify = function(file) {
                file = file.toLowerCase()
                if(cache[file])
                    return cache[file]
            
                var filePath = path.join(rootPath, file)
                // console.log('filePath', filePath)

                if(!fs.existsSync(filePath))
                    return file
            
                var data = fs.readFileSync(filePath)
            
                cache[file] = file + '?' + cs(data).substr(0, 10)
                return cache[file]
            }
            
            return function(req, res, next) {
                res.locals.asset = function(file) {
                    return checksumify(file)
                }
                next()
            }
        }
    }
    return middleWares
}

function getParameterByName(name, url) {
    name = name.replace(/[\[\]]/g, '\\$&');
    var regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)'),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, ' '));
}

function removeDuplicatesInUrlParams(url, parameter) {
    //prefer to use l.search if you have a location/link object
    var urlparts= url.split('?');   
    if (urlparts.length>=2) {

        var stuff = urlparts[1];
        pars = stuff.split("&");
        var comps = {};
        for (i = pars.length - 1; i >= 0; i--) {
            spl = pars[i].split("=");
            if (spl[0] && spl[1])
                comps[spl[0]] = spl[1];
        }
        pars = [];
        for (var a in comps)
            pars.push(a + "=" + comps[a]);
        url = urlparts[0] + '?' + pars.join('&');
        return url;
    } else {
        return url;
    }
}

function getEvent() {
    const events = require('../json/events.json')
    return events.find(event => {
        return moment().isBetween(event.from, event.to)
    })

}

function isCurrencyExists(prices, currency) {
    if (prices[0][currency])
        return true
    else
        return false
}