const moment = require('moment');
const fs = require('fs');
const norobot = require('norobot');
const prices = require('./../json/prices.json');
const pageLangs = require('./../json/pageLangs.json');
const slackApi = require('./slackApi.js');
let event = getEvent()

setInterval(() => {
    event = getEvent()
}, 60000);

var affFilter = [
    '7212',
    '7208',
    '7109',
    '6959',
    '6476',
    '5822'
]

module.exports = (app) => {

    const middleWares = {
        setVariables: (req, res, next) => {
            res.locals.query = req.query
            res.locals.urlSearch = req.search = req.url.split('?').length > 1 ? '?' + req.url.split('?')[1] : "?"
            res.locals.pageName = req.pageName = req.path.replace('/offer', '').replace('/amp', '').slice(1).replace('.html', '').replace('.HTML', '').replace(/\/$/, '')
            res.locals.path = req.path
            res.locals.event = req.event = event
            if (event && event.coupon)
                middleWares.forceCoupon(event.coupon, req, res)

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


        languageRedirects: (req, res, next) => {
            var options = {
                domain: '.privateinternetaccess.com',
                maxAge: 1000 * 60 * 60 * 24 * 30, // would expire after 30 days
                httpOnly: true, // The cookie only accessible by the web server
                signed: true // Indicates if the cookie should be signed
            }
        
            var cookie = req.signedCookies['pia_lang'];
            var noLangInUrl = req.originalUrl.replace('/offer', '').indexOf(req.pageName) == 1
            // console.log('cookie', cookie)
            // console.log('noLangInUrl', noLangInUrl)
        
            if (noLangInUrl && cookie !== undefined) {
                // If lang cookie found
                console.log('Found Cookie - Redirecting to', '/' + cookie + '/' + req.pageName + req.search)
                res.redirect('/' + cookie + '/' + req.pageName + req.search)
                return;
            } else {
                // If detected default locale (not in URL)
                if (noLangInUrl) {
                    console.log('Adding locale to the URL - Redirecting to', '/' + req.lang + req.path + req.search)
                    res.redirect('/' + req.lang + req.path + req.search)
                    return;
                }   
                console.log(req.path)
                res.cookie('pia_lang', req.lang, options);
                console.log('cookie created successfully with value: ' + req.lang);
                next()
            }
        },


        setOfferType: (req, res, next) => {
            var cookie_offerType = req.cookies["offer_type"];
        
            if (cookie_offerType) {
                console.log('Detected offer TYPE:', cookie_offerType)
                req.offerType = cookie_offerType
            } else {
                switch (req.hostname) {
                    case 'security.privateinternetaccess.com':
                        req.offerType = 'GOOGLE'
                        break;
                    case 'safe.privateinternetaccess.com':
                        req.offerType = 'CJ'
                        break;
                    case 'offer.privateinternetaccess.com':
                        req.offerType = 'OFFER'
                        break;
                    case 'maskip.co':
                        req.offerType = 'CPP'
                        break;
                    case 'hideip.tech':
                        req.offerType = 'CPP'
                        break;
                    default:
                        req.offerType = 'LOCAL'
                        break;
                }
            }
        
            var forced_type_cookie = req.signedCookies['forced_type_cookie'];
            if (req.offerType === 'LOCAL') {
                if (req.query.type) {
                    req.offerType = req.query.type
                    const options = {
                        httpOnly: true,
                        signed: true,
                        maxAge: (3 * 60 * 1000)
                    }
                    res.cookie('forced_type_cookie', req.offerType, options);
                } else if (forced_type_cookie)
                    req.offerType = forced_type_cookie
            }

            res.locals.offerType = req.offerType
            next();
        },

        rotatorIdCheck: (req, res, next) => {

            var rotatorId = req.pageName.split('%3F')[0].split('%20')[0].split('&')[0].split('/')
            rotatorId = rotatorId[rotatorId.length - 1]
            const matchKey = Object.keys(app.rotators).find(key => key.toLowerCase() === rotatorId.toLowerCase())

            if (matchKey) {
                console.log('Detected rotator ID:', matchKey)
                let totalWeight = app.rotators[matchKey].totalWeight
                let newWeight = 100
                const randomNumber = Math.floor(Math.random() * 100) + 1
                const redirectOffer = app.rotators[matchKey].offers.find(offer => {
                    newWeight = Math.floor(newWeight - ((offer.weight / totalWeight) * 100))
                    return (randomNumber > newWeight)
                });
                if (!redirectOffer) redirectOffer = app.rotators[matchKey].offers[0]
                // console.log('totalWeight', totalWeight)
                // console.log('randomNumber', randomNumber)
                // console.log('newWeight', newWeight)
                // console.log('redirectOffer', redirectOffer)
                let redirectLink = "" 
                if (redirectOffer.type) {
                    res.cookie("offer_type", redirectOffer.type, {maxAge: 15000});
        
                    if (redirectOffer.type === "CPP")
                        redirectLink += "https://maskip.co"
        
                    if (redirectOffer.language && redirectOffer.language !== 'auto')
                        redirectLink += '/' + redirectOffer.language
                }
                redirectLink += redirectOffer.link + '&' + req.search.slice(1)
        
                if (redirectOffer.type === "OFFER" || redirectOffer.type === "CPP")
                        redirectLink += '&utm_medium=affiliate&utm_source=' + app.rotators[matchKey].aff_id
                
                if (req.forceCoupon) {
                    const oldCoupon = getParameterByName('coupon', redirectLink)
                    const affId = getParameterByName('aff_id', redirectLink)
    
                    if (oldCoupon && ((affId && !affFilter.includes(affId)) || !affId)) {
                        var regex = new RegExp(oldCoupon, 'g')
                        redirectLink = redirectLink.replace(regex, req.forceCoupon)
                    } else {
                        redirectLink += '&coupon=' + req.forceCoupon
                    }
                    redirectLink = removeDuplicatesInUrlParams(redirectLink, 'coupon')
                }

                res.redirect(redirectLink);
        
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

            if (req.userLocation.cn === "United Kingdom" && isCurrencyExists(req.prices, "GBP"))
                req.currency = "GBP"
            else if (req.userLocation.cn === "Turkey" && isCurrencyExists(req.prices, "TRY"))
                req.currency = "TRY"
            else if ((req.userLocation.cn === "Russia" || req.userLocation.cn === "Ukraine") && isCurrencyExists(req.prices, "RUB"))
                req.currency = "RUB"
            else if (req.userLocation.cn === "Republic of Korea" && isCurrencyExists(req.prices, "KRW"))
                req.currency = "KRW"
            else if (req.userLocation.cn === "Switzerland" && isCurrencyExists(req.prices, "CHF"))
                req.currency = "CHF"
            else if (eurCountries.includes(req.userLocation.cn) && isCurrencyExists(req.prices, "EUR"))
                req.currency = "EUR"
            else 
                req.currency = "USD"

            res.locals.currency = req.currency
            next()
        },

        setPrices: (req, res, next) => {

            res.locals.oldPrices = req.oldPrices = prices.original

            if (req.query.coupon && prices.coupons[req.query.coupon])
                res.locals.prices = req.prices = prices.coupons[req.query.coupon]
            else
                res.locals.prices = req.prices = prices.main
        
            next()
        },

        show404: (err, req, res, offersApi) => {
            console.log(err)
            var query = req.query;
            req.offerId = '757'
            req.extraParams = '&aff_id=2009&aff_sub3=' + req.path + '&aff_sub2='+ req.offerType 
            offersApi.impressionPixel(req)
            slackApi.sendErrorMessage('404 Error', err || {content: 'Not Found'}, req)
            res.status(404);
            res.format({
                html: function () {
                    res.render('errors/404', { 
                        url: req.path,
                        pageName: '404',
                        query: query,
                        urlSearch: req.search,
                        offerLink: 'https://ho-app.kape.com/SHUZ?aff_sub3=' + req.path + '&aff_sub2=' + req.offerType + '&' + req.search.slice(1),
                        offerType: req.offerType
                    })
                },
                json: function () {
                    res.json({ error: 'Not found' })
                },
                default: function () {
                    res.type('txt').send('Not found')
                }
            })
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