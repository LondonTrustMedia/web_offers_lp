const request = require('request');
const fs = require('fs')
const async = require('async')
const newPages = require('./../json/newPages.json')
var offersList = require('./../json/offers.json')
var setMondayOffer = require('./mondayApi.js')
const slackApi = require('./slackApi.js');
const mws = require('./mws.js')();
const requestFilter = require('./requestFilters.js');

var exampleNewPageFile = [
    {
        "name": "Example Page",
        "path": "example",
        "OFFER": true,
        "CPP": false
    }
]

var offersApi = module.exports = {

    getLink: function(req, res, callback){

        var path = req.pageName
        if (req.newPath !== undefined) path = req.newPath
    
        switch (req.offerType) {
            case 'GOOGLE':
                res.locals.offerLink = req.offerLink = 'https://zenmate.com/' + req.lang + "/order?" + req.search.slice(1)
                res.locals.offerID = req.offerId = "";
                callback()
                break;
            case 'CJ':
                res.locals.offerLink = req.offerLink = 'https://zenmate.com/' + req.lang + "?media_source=CJ_affiliates&channel=External+LPs&" + req.search.slice(1)
                res.locals.offerID = req.offerId = "";
                callback()
                break;
            case 'OFFER':
                if (offersList[path]) offerId = offersList[path].offer_ID
                else offerId = "";
                break;
            case 'CPP':
                if (offersList[path]) offerId = offersList[path].CPP_ID
                else offerId = "";
                break;
            case 'LOCAL':
                offerId = '12345'
                break;
        }
        if (req.offerType !== "GOOGLE" && req.offerType !== "CJ"){
            if (!offerId){
                mws.show404('Offer ID is null', req, res, offersApi)
            } else {
                res.locals.offerLink = req.offerLink = 'https://ho-app.kape.com/aff_c?offer_id=' + offerId + '&lang_page=' + req.lang + '&' + req.search.substring(1, req.search.length)
                res.locals.offerID = req.offerId = offerId;
                console.log(req.offerLink)
                callback()
            }
        }
        
    },

    impressionPixel: function(req){
        if (req.offerId && requestFilter(req)) {
            var userAgent = req.header('User-Agent')
            if (req.ip === "::1" || req.ip === "127.0.0.1") var userIP = '81.180.227.170'
            else userIP = req.ip.replace(/::ffff:/, '')
    
            const options = {
                url: 'https://ho-app.kape.com/aff_i?offer_id='+ req.offerId + '&' + req.search.slice(1) + (req.extraParams ? req.extraParams : ''),
                followRedirect: false,
                headers: {
                  'User-Agent': userAgent,
                  'X-Forwarded-For': userIP
                }
            };
    
            // console.log(options)
            request.get( options, function(err, response, body){
                if (err || !body) {
                    console.log('Error setting impression pixel on HasOffers')
                    console.log(err)
                    slackApi.sendErrorMessage('Error setting impression pixel on HasOffers', err || {content: 'UNDEFINDED'}, req)
                } else {
                    // console.log('impression success')
                }
            })
        }
    },


    getLinkForRotator: function(offerId, aff_id, callback){
        const url = 'https://cyberghost.api.hasoffers.com/Apiv3/json?NetworkToken=NETVMQXHWFNAGGTFnGo2f32FxB8hkQ&Target=Offer&Method=generateTrackingLink&offer_id=' + offerId + '&affiliate_id=' + aff_id + '&options[tiny_url]=0'
        // console.log(url)
        request.get(url, function(err, response, body){
            console.log(body)
            const data = JSON.parse(body).response
            if (err || data.status == '-1') callback(err || data.errors)
            else {
                let link = data.data.click_url;
                callback(null, link)
            }
        })
    },


    approveAffiliate: function (offerId, aff_id, callback) {
        const url = 'https://cyberghost.api.hasoffers.com/Apiv3/json?NetworkToken=NETVMQXHWFNAGGTFnGo2f32FxB8hkQ&Target=Offer&Method=setAffiliateApproval&id=' + offerId + '&affiliate_id=' + aff_id + '&status=approved'
        console.log('Approving affiliate ', aff_id, '| offer ID:', offerId)
        request.get(url, function(err, response, body){
            if (err){
                console.log("error approving affiliate:")
                console.log(err)
                callback(err)
            } else {
                let status = false
                console.log(JSON.parse(body).response)
                try {
                    status = JSON.parse(body).response.status
                } catch (e) {console.log(e)}
                if (status === 1) {
                    console.log("success approving affiliate!")
                    callback()
                } else {
                    if (JSON.parse(body).response.errorMessage.includes('API usage exceeded')) {
                        setTimeout(function() {offersApi.approveAffiliate(offerId, aff_id, callback)}, 15000)
                   } else {
                       console.log("error approving affiliate:")
                       slackApi.errorToNitool('Can\'t Aprrove affiliate ' + aff_id + ' for offer ' + offerId , {'body': body})
                       console.log(body)
                       callback(body)
                   }
                }
            }
        })
    },

    setPayout: function (offerId, aff_id, payout, callback) {
        const url = 'https://cyberghost.api.hasoffers.com/Apiv3/json?NetworkToken=NETVMQXHWFNAGGTFnGo2f32FxB8hkQ&Target=Offer&Method=setPayout&id=' + offerId + '&affiliate_id=' + aff_id + '&payout=' + payout
        console.log('Setting payout for affiliate ', aff_id, '| payout:', payout,'| offer ID:', offerId)
        request.get(url, function(err, response, body){
            if (err){
                console.log("error setting affiliate payout:")
                console.log(err)
                callback(err)
            } else {
                let status = false
                try {
                    status = JSON.parse(body).response.status
                } catch (e) {console.log(e)}
                if (status === 1) {
                    console.log("success setting affiliate payout!")
                    callback()
                } else {
                    if (JSON.parse(body).response.errorMessage.includes('API usage exceeded')) {
                         setTimeout(function() {offersApi.setPayout(offerId, aff_id, payout, callback)}, 15000)
                    } else {
                        console.log("error setting affiliate payout:")
                        slackApi.errorToNitool('Can\'t set payout for affiliate ' + aff_id + ' for offer ' + offerId , {'body': body})
                        console.log(body)
                        callback(body)
                    }
                }
            }
        })
    },

    getPayout: function (offerId, aff_id, callback) {
        const url = 'https://cyberghost.api.hasoffers.com/Apiv3/json?NetworkToken=NETVMQXHWFNAGGTFnGo2f32FxB8hkQ&Target=Offer&Method=getAffiliatePayout&id=' + offerId + '&affiliate_id=' + aff_id
        console.log('Getting affiliate ', aff_id, 'payout for offer ID:', offerId)
        request.get(url, function(err, response, body){
            if (err){
                console.log("error getting affiliate payout:")
                console.log(err)
                callback(err)
            } else {
                try {
                    payout = JSON.parse(body).response.data.OfferPayout
                } catch (e) {console.log(e)}
                if (payout) {
                    payout = parseFloat(payout.payout).toFixed(2)
                    console.log('Payout is', payout)
                    callback(null, payout)
                } else {
                    const url2 = 'https://cyberghost.api.hasoffers.com/Apiv3/json?NetworkToken=NETVMQXHWFNAGGTFnGo2f32FxB8hkQ&Target=Offer&Method=findById&id=' + offerId + '&fields[]=default_payout'
                    console.log('No Special Payout for this affiliate - Getting default payout')
                    request.get(url2, function(err, response, body){
                        if (err){
                            console.log("error getting default payout:")
                            console.log(err)
                            callback(err)
                        } else {
                            try {
                                payout = JSON.parse(body).response.data.Offer.default_payout
                            } catch (e) {
                                console.log("error getting default payout:")
                                console.log(e)
                                console.log('body', body)
                                callback(e)
                            }
                            if (payout) {
                                payout = parseFloat(payout).toFixed(2)
                                console.log('Payout is', payout)
                                callback(null, payout)
                            } else {
                                if (JSON.parse(body).response.errorMessage.includes('API usage exceeded')) {
                                     setTimeout(function() {offersApi.getPayout(offerId, aff_id, callback)}, 15000)
                                } else {
                                    console.log("error getting affiliate payout:")
                                    slackApi.errorToNitool('Can\'t get payout for affiliate ' + aff_id + ' for offer ' + offerId , {'body': body})
                                    console.log(body)
                                    callback(body)
                                }
                            }
                        }
                    })
                }
            }
        })
    },

    createNewOffers: function(){
        var newOffers = {}
        async.forEach(newPages, function(page, next){
            if (page.path === 'example'){
                 next()
             } else {
                 async.parallel([
                     function(callback) {
                         // if there is input and offer does not exists
                         if (page.OFFER && (!offersList[page.path] || (offersList[page.path] && offersList[page.path].offer_ID === ""))){
                            var preview_url = 'https://offer.zenmate.com/' + page.path
                            var offer_name = 'Gen - Offer - ' + page.name + ' - Desktop - WW - CPA - PIA'
                            HOcreateRequest(preview_url, offer_name, function(err, offerId){
                                if (err) callback(err)
                                else {
                                    offersApi.approveAffiliate(offerId, 2009, () => {
                                        setMondayOffer('OFFER', page, offerId, () => {
                                            callback(null, offerId)
                                        })
                                    })
                                }
                            })
                            // if there is input and offer exists
                         } else if (offersList[page.path] && offersList[page.path].offer_ID !== ""){
                             if (page.OFFER) console.error('page ' + page.path + ' already exists in \'offers.json\' file and has OFFER id')
                             callback(null, offersList[page.path].offer_ID)
                             // if there is NO input and offer exists
                         } else {
                             callback(null, "")
                         }
                     },
                     function(callback) {
                         // if there is input and offer does not exists
                         if (page.CPP && (!offersList[page.path] || (offersList[page.path] && offersList[page.path].CPP_ID === ""))){
                            var preview_url = 'https://maskip.co/' + page.path
                            var offer_name = 'Gen - CPP - ' + page.name + ' - Desktop - WW - CPA - PIA'
                            HOcreateRequest(preview_url, offer_name, function(err, cppId){
                                if (err) callback(err)
                                else {
                                    offersApi.approveAffiliate(cppId, 2009, () => {
                                        setMondayOffer('CPP', page, cppId, () => {
                                            callback(null, cppId)
                                        })
                                    })
                                }
                            })
                         // if there is input and offer exists
                         } else if (offersList[page.path] && offersList[page.path].CPP_ID !== ""){
                             if (page.CPP) console.error('page ' + page.path + ' already exists in \'offers.json\' file and has CPP id')
                             callback(null, offersList[page.path].CPP_ID)
                         // if there is NO input and offer exists
                         } else {
                             callback(null, "")
                         }
                     }
                ], function(err, results) {
                     if (err) next(err)
                     else {
                         newOffers[page.path]  = {
                             "offer_ID": results[0],
                             "CPP_ID": results[1],
                         }
                         setMondayOffer('GOOGLE', page, null, () => {
                             next()
                         })
                     }
                 });
                }
            }, function(err) {
                if (err) {
                  console.error(err)
                } else {
                    if (Object.keys(newOffers).length === 0 && newOffers.constructor === Object) {
                        console.log('No new offers to create')
                    } else {
                        fs.writeFile( __dirname + '/../json/offers.json', JSON.stringify(Object.assign(offersList, newOffers), null, 4), 'utf8', function(err, res){
                            if (err) console.error(err)
                            else console.log('file updated')
                        })
                        fs.writeFile( __dirname + '/../json/newPages.json', JSON.stringify(exampleNewPageFile, null, 4), 'utf8', function(err, res){
                            if (err) console.error(err)
                        })
                    }
                }
        })
    }
}


function HOcreateRequest(preview_url, offer_name, callback){
    var offer_url = 'https://zenmate.com/{lang_page}/order?affiliate={affiliate_id}&wmid=cc&cpid={offer_id}&offer_id={offer_id}&utm_source={affiliate_id}&utm_medium=affiliate&transaction_id={transaction_id}&coupon={coupon}&conversionpoint={aff_sub5}&channel=External+LPs&affiliate_google_clientid={affiliate_google_clientid}&media_source=inhouse_affiliates&zm_spc_pg=zm_med_1&zm_spc_preset=aff_p'
    
    var callUrl =  'https://cyberghost.api.hasoffers.com/Apiv3/json?NetworkToken=NETVMQXHWFNAGGTFnGo2f32FxB8hkQ&Target=Offer&Method=create&data[expiration_date]=2023-01-08+00%3A00%3A00&data[advertiser_id]=527&data[require_approval]=0&data[is_private]=1&data[status]=active&data[enforce_secure_tracking_link]=1&data[session_impression_hours]=24&data[show_custom_variables]=1&data[session_hours]=672&data[revenue_type]=cpa_flat&data[payout_type]=cpa_flat&data[protocol]=server&data[max_payout]=110.000&data[default_payout]=40.000'
    + '&data[hostname_id]=18151'
    + '&data[offer_url]=' + encodeURIComponent(offer_url)
    + '&data[preview_url]=' + encodeURIComponent(preview_url)
    + '&data[name]=' + encodeURIComponent(offer_name)

    request.get(callUrl, function(err, response, body){
        var data = JSON.parse(body).response
        // console.log(data)
        if (err || data.status == '-1') callback(err || data.errors)
        else {
            console.log("Created New offer:")
            console.log("Offer Name: " + offer_name)
            console.log("Offer ID: " + data.data.Offer.id)
            callback(null, parseInt(data.data.Offer.id));
        }

    })
}