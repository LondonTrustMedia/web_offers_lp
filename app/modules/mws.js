const moment = require('moment');
const fs = require('fs');
const norobot = require('norobot');
const prices = require('./../json/prices.json');
const channels = require('./../json/youtube_channels.json');
const slackApi = require('./slackApi.js');
const offersApi = require('./offersApi.js');
const path = require('path')
const cs = require('checksum');
let event = getEvent()
const devicesScript = require('./devicesScript.js');
const bestScript = require('./best-script.js');

let cache = [];

const langSubdomains = {
    eng: 'www',
    fra: 'fra',
    deu: 'deu',
    dan: 'dnk',
    ita: 'ita',
    jpn: 'jpn',
    nld: 'nld',
    nor: 'nor',
    por: 'bra',
    rus: 'rus',
    spa: 'mex'
}

// setInterval(() => {
//     event = getEvent()
// }, 60000);

module.exports = (app) => {

    const middleWares = {
        setVariables: (req, res, next) => {
            res.locals.query = req.query
            res.locals.urlSearch = req.search = req.url.split('?').length > 1 ? '?' + req.url.split('?')[1] : "?"
            req.fixedHost = req.get('host').includes('offers-lp.piaservers') ? req.get('host').replace('offers-lp.piaservers', 'privateinternetaccess') + '/offer' : req.get('host')
            res.locals.urlForLang = (req.fixedHost  + req.originalUrl).replace(/^.*privateinternetaccess.com/g, 'privateinternetaccess.com').replace(/^.*pialocal.com/g, 'pialocal.com')
            res.locals.pageName = req.pageName = req.path.replace('/offer', '').replace('/amp', '').slice(1).replace('.html', '').replace('.HTML', '').replace(/\/$/, '')
            res.locals.path = req.path
            res.locals.event = req.event = event
            // if (event && event.coupon)
            //     middleWares.forceCoupon(event.coupon, req, res)
            next()
        },

        setLocaleFromSubdomain: (req, res, next) => {
            console.log('req.subdomains', req.subdomains)
            if (req.subdomains.length) {
                const lang = Object.keys(langSubdomains).find(key => langSubdomains[key] === req.subdomains[0]) || 'eng'
                req.setLocale(lang)
            }
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

            let deal = ''
            // if (req.query.deal && prices.coupons[req.query.deal])
            //     deal = req.query.deal
            switch (req.lang) {
                case 'deu':
                    res.locals.offerLink = req.offerLink = `https://deu.privateinternetaccess.com/pages/jetzt-kaufen${deal}/` + (req.query && req.query.coupon ? req.query.coupon : '')
                    break;
            
                case 'fra':
                    res.locals.offerLink = req.offerLink = `https://fra.privateinternetaccess.com/pages/acheter-maintenant${deal}/` + (req.query && req.query.coupon ? req.query.coupon : '')
                    break;
                    
                case 'dan':
                    res.locals.offerLink = req.offerLink = `https://dnk.privateinternetaccess.com/pages/dnk-buy-now${deal}/` + (req.query && req.query.coupon ? req.query.coupon : '')
                    break;
            
                case 'ita':
                    res.locals.offerLink = req.offerLink = `https://ita.privateinternetaccess.com/pages/ita-buy-now${deal}/` + (req.query && req.query.coupon ? req.query.coupon : '')
                    break;
                    
                case 'jpn':
                    res.locals.offerLink = req.offerLink = `https://jpn.privateinternetaccess.com/pages/jpn-buy-now${deal}/` + (req.query && req.query.coupon ? req.query.coupon : '')
                    break;
            
                case 'nld':
                    res.locals.offerLink = req.offerLink = `https://nld.privateinternetaccess.com/pages/nld-buy-now${deal}/` + (req.query && req.query.coupon ? req.query.coupon : '')
                    break;
                    
                case 'nor':
                    res.locals.offerLink = req.offerLink = `https://nor.privateinternetaccess.com/pages/nor-buy-now${deal}/` + (req.query && req.query.coupon ? req.query.coupon : '')
                    break;
            
                case 'por':
                    res.locals.offerLink = req.offerLink = `https://bra.privateinternetaccess.com/pages/bra-buy-now${deal}/` + (req.query && req.query.coupon ? req.query.coupon : '')
                    break;
                    
                case 'rus':
                    res.locals.offerLink = req.offerLink = `https://rus.privateinternetaccess.com/pages/rus-buy-now${deal}/` + (req.query && req.query.coupon ? req.query.coupon : '')
                    break;
            
                case 'spa':
                    res.locals.offerLink = req.offerLink = `https://mex.privateinternetaccess.com/pages/mex-buy-now${deal}/` + (req.query && req.query.coupon ? req.query.coupon : '')
                    break;
                    
                default:
                    res.locals.offerLink = req.offerLink = `https://www.privateinternetaccess.com/pages/buy-now${deal}/` + (req.query && req.query.coupon ? req.query.coupon : '')
                    break;
            }
            
            if (req.search !== '?')
                res.locals.offerLink = req.offerLink += (req.offerLink.includes('?') ?  '&' + req.search.slice(1) :  req.search)

            res.locals.offerLink = req.offerLink = RemoveParametersFromUrl(req.offerLink, ['coupon'])

                
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
            console.log('req.get(\'host\')', req.fixedHost )
            if (noLangInUrl && cookie !== undefined) {
                // If lang cookie found
                console.log('Found Cookie - Redirecting to', req.protocol + '://' + cookie + '.' + req.fixedHost  + req.originalUrl)
                res.redirect(301, req.protocol + '://' + langSubdomains[cookie] + '.' + req.fixedHost + req.originalUrl)
                return;
            } else if (noLangInUrl) {
                    console.log('Adding locale to the URL - Redirecting to', req.protocol + '://' + cookie + '.' + req.fixedHost  + req.originalUrl)
                    res.redirect(301, req.protocol + '://' + langSubdomains[req.lang] + '.' + req.fixedHost  + req.originalUrl)
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

                const langCookie = req.signedCookies['pia_lang'];
                const rotator = app.rotators[matchKey]
                let redirectOffer, linkLang
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
                
                if (!redirectOffer) redirectOffer = app.rotators[matchKey].offers[0]
                
                if (redirectOffer.language && redirectOffer.language !== 'auto')
                    linkLang = redirectOffer.language
                else if (langCookie)
                    linkLang =  langSubdomains[langCookie]
                else
                    linkLang = langSubdomains[req.lang]
                
                let redirectLink = "" 
                if (redirectOffer.type) {
                    res.cookie("offer_type", redirectOffer.type, {maxAge: 15000});
                    
                    redirectLink = 'https://' + linkLang + '.'

                    if (redirectOffer.type === "OFFER")
                        redirectLink += "privateinternetaccess.com/offer"
                    else if (redirectOffer.type === "CPP")
                        redirectLink += "privateinternetaccess.com/offer"
                        
                } else
                    redirectOffer.link = redirectOffer.link.replace('//privateinternetaccess.com', '//' + linkLang + '.'  + 'privateinternetaccess.com')

                redirectLink += redirectOffer.link

                if (redirectLink.includes('?'))
                    redirectLink += '&' + req.search.slice(1)
                else
                    redirectLink += req.search

                redirectLink = redirectLink.replace('&&', '&')

                
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

        
                res.redirect(301, redirectLink);

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

            try {
                if ((req.userLocation.cn === "Russia" || req.userLocation.cn === "Ukraine") && isCurrencyExists(req.prices, "RUB"))
                    res.locals.currency = req.currency = {
                        iso: "RUB",
                        symbol: "руб",
                        text: req.gettext('Russian Rubles')
            
                    }
                else if (req.userLocation.cn === "India" && isCurrencyExists(req.prices, "INR"))
                    res.locals.currency = req.currency = {
                        iso: "INR",
                        symbol: "₹",
                        text: req.gettext('Indian Rupee')
            
                    }
                else if (req.userLocation.cn === "Brazil" && isCurrencyExists(req.prices, "BRL"))
                        res.locals.currency = req.currency = {
                            iso: "BRL",
                            symbol: "R$",
                            text: req.gettext('Brazilian Reals')
                        }
                else if (req.userLocation.cn === "United Kingdom" && isCurrencyExists(req.prices, "GBP"))
                    res.locals.currency = req.currency = {
                        iso: "GBP",
                        symbol: "£",
                        text: 'British Pounds Sterling'
                    }
                else if (req.userLocation.cn === "Japan" && isCurrencyExists(req.prices, "JPY"))
                    res.locals.currency = req.currency = {
                        iso: "JPY",
                        symbol: "¥",
                        text: req.gettext('Japanese Yen')
            
                    }
                else if (req.userLocation.cn === "Australia" && isCurrencyExists(req.prices, "AUD"))
                        res.locals.currency = req.currency = {
                            iso: "AUD",
                            symbol: "AU$",
                            text: req.gettext('Australian Dollars')
                        }
                else if (req.userLocation.cn === "Switzerland" && isCurrencyExists(req.prices, "CHF"))
                        res.locals.currency = req.currency = {
                            iso: "CHF",
                            symbol: "CHF",
                            text: req.gettext('Swiss Francs')
                        }
                else if (eurCountries.includes(req.userLocation.cn))
                    res.locals.currency = req.currency = {
                        iso: "EUR",
                        symbol: "€",
                        text: req.gettext('Euros')
                    }
                // else if (req.lang === 'de' ||
                //     req.lang === 'es' ||
                //     req.lang === 'fr' ||
                //     req.lang === 'it' ||
                //     req.lang === 'pl' ||
                //     req.lang === 'ro' ||
                //     req.lang === 'nl' ||
                //     req.lang === 'ko' )
                //     res.locals.currency = req.currency = {
                //         iso: "EUR",
                //         symbol: "€",
                //         text: req.gettext('Euros')
                //     }
            
                else 
                    res.locals.currency = req.currency = {
                        iso: "USD",
                        symbol: "$",
                        text: req.gettext('US Dollars')
            
                    }
            } catch (e) {
                console.log(e)
                res.locals.currency = req.currency = {
                    iso: "USD",
                    symbol: "$",
                    text: req.gettext('US Dollars')
                }
            }
            next()
        },

        setPrices: (req, res, next) => {

            res.locals.oldPrices = req.oldPrices = prices.original.main
            res.locals.prices = req.prices = prices.coupons.main

            // if (req.query.deal && prices.coupons[req.query.deal])
            //     res.locals.prices = req.prices = prices.coupons[req.query.deal]

            // if (req.query.deal && prices.original[req.query.deal])
            //     res.locals.oldPrices = req.oldPrices = prices.original[req.query.deal]
        
            next()
        },
        setChannels: (req, res, next) => {
            res.locals.channels = req.channels = channels
            next()
        },
        show404: (err, req, res, next) => {
            console.log(err)
        
            req.offerId = '1332'
            req.extraParams = '&aff_id=2009&aff_sub3=' + req.pageName
            offersApi.impressionPixel(req)

            if (req.originalUrl.includes('HasOffers_fallback'))
                slackApi.sendFallbackMessage(req)
            else
                slackApi.sendErrorMessage('404 Error', err || {content: 'Not Found'}, req)

            res.status(404);
            res.format({
                html: function () {
                    res.render('errors/404', { 
                        url: req.path,
                        pageName: '404',
                        offerLink: 'https://ho-app.kape.com/SHa5?aff_sub3=' + req.path + '&' + RemoveParametersFromUrl(req.search, ['aff_id', 'offer_id']).slice(1),
                        query: req.query,
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
        
        getDevices: devicesScript,

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
        },
        getBestCountry: bestScript
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
    console.log('prices', prices)
    if (prices.blocks[0][currency])
        return true
    else
        return false
}

function RemoveParametersFromUrl(url, parameters) {
    parameters.forEach( parameter => {
        url = url
                .replace(new RegExp('[?&]' + parameter + '=[^&#]*(#.*)?$'), '$1')
                .replace(new RegExp('([?&])' + parameter + '=[^&]*&'), '$1');
    })
    return url
}

function RemoveParameterFromUrl(url, parameter) {
    return url
      .replace(new RegExp('[?&]' + parameter + '=[^&#]*(#.*)?$'), '$1')
      .replace(new RegExp('([?&])' + parameter + '=[^&]*&'), '$1');
}