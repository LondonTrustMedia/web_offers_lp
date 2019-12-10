

let hoOffers = require('./json/offers.json');
const offersApi = require('./modules/offersApi.js');
const fs = require('fs')
const async = require('async')

// app/routes.js
module.exports = function (app) {
    const dbQueries = require('./modules/dbQueries.js')(app.db);


    dbQueries.updateCache((err, rotators) => {
        if (!err) {
            app.rotators = rotators
            console.log("Rotators Cache Updated")

            // var keys = Object.keys(rotators)
            // keys.forEach(key => {
            //     // var needChange = false
            //     rotators[key].offers.forEach(offer => {
            //         if (offer.params !== '')
            //             offer.params += '&'
            //         offer.params += "coupon=175m"
            //         offer.link += "&coupon=175m"

            //     });
            //     // if (needChange) {
            //     rotators[key].updated = new Date().toISOString();
            //     console.log(rotators[key])
            //     dbQueries.edit(rotators[key], (err) => {
            //         if (err) console.log(err)
            //     })
            //     console.log('Account Manager:', rotators[key].ownerName, ' |  Affiliate ID:', rotators[key].aff_id, ' |  Link ID:', rotators[key].id)
            //     // }
            // });

        }
    })

    setInterval(function(){
        dbQueries.updateCache((err, rotators) => {
            if (!err) {
                app.rotators = rotators
                console.log("Rotators Cache Updated")
            }
        })
    }, 60000)
    
    // dbQueries.delete('test_24nkf23', (err) => {
    //     if (err) console.log(err)
    // })

    app.get('/rotator', function ( req, res ) {
        dbQueries.getAll((err, newRotators) => {
            if (!err) {
                res.json(newRotators)
                res.end()
            } else {
                res.json(err)
                res.end()
            }
        })
    });

    app.post('/rotator', processData, function ( req, res ) {
        // console.log(req)
        const isNew = req.body.edit === '0'
        if (isNew){
            console.log(req.body)
            dbQueries.new(req.body, (err) => {
                if (err) console.log(err)
                res.end(err)
            })
        } else {
            dbQueries.edit(req.body, (err) => {
                if (err) console.log(err)
                res.end(err)
            })

        }
        delete req.body.edit
        app.rotators[req.body.id] = req.body
        fs.writeFile( __dirname + '/json/rotators.json', JSON.stringify(app.rotators, null, 4), 'utf8', (err, result) => {
            if (err) console.error(err)
            res.end()
        })
    });

    app.delete('/rotator', function ( req, res ) {
        console.log('Deleting', req.body.id)

        dbQueries.delete(req.body.id, (err) => {
            if (err) console.log(err)
            res.end(err)
        })

        delete app.rotators[req.body.id]
        fs.writeFile( __dirname + '/json/rotators.json', JSON.stringify(app.rotators, null, 4), 'utf8', (err, result) => {
            if (err) console.error(err)
            res.end()
        })

    });

};

function processData(req, res, next) {
    let rotators = {}
    try {
        let rotators = require('./json/rotators.json');
    } catch (e) {
        console.log(e)
    }
    if (req.body.edit === '0' && rotators[req.body.id]){
            var error = 'Duplicate Name: ' + req.body.id;
            console.log(error)
            res.status(500).json({ error: error })
    } else {
        req.body.totalWeight = 0
        req.body.offers.map(offer => {
            offer.weight = parseInt(offer.weight)
            req.body.totalWeight += offer.weight
            offer.id = offer.offerName.replace(/(.*\(id:)(.*[0-9])(\))/g, '$2')
            if (offer.offerName.toLowerCase().includes('gen - offer -') || offer.offerName.toLowerCase().includes('gen - cpp -')) {
                offer.type = offer.offerName.toLowerCase().includes('- offer -') ? 'OFFER' : 'CPP'
                offer.local = true
                const selectedPath = Object.values(hoOffers).findIndex(path => {
                    return (path.offer_ID == offer.id || path.CPP_ID == offer.id)
                })
                const path = '/' + Object.keys(hoOffers)[selectedPath]
                offer.link = path
                offer.link += offer.link.includes('?') ? '&aff_id=' + req.body.aff_id : '?aff_id=' + req.body.aff_id
                if (offer.params) 
                    offer.link += '&' + offer.params
            } else if (offer.offerName.toLowerCase().includes('http')) {
                offer.local = false
                offer.link = offer.offerName
                offer.offerName = offer.offerName.replace('http://', 'https://')
                if (!offer.offerName.includes('aff_id')) 
                    offer.offerName.includes('?') ? offer.link += '&aff_id=' + req.body.aff_id : offer.link += '?aff_id=' + req.body.aff_id
                if (offer.params) 
                    offer.link += '&' + offer.params
            } else {
                offer.local = false
                offer.link = 'https://ho-app.zenmate.com/aff_c?offer_id=' + offer.id + '&aff_id=' + req.body.aff_id
                if (offer.params) 
                    offer.link += '&' + offer.params
            }
            return offer
        })
        // next()
        async.eachLimit(req.body.offers, 1, (offer, nextOffer) => {
            if (!offer.offerName.toLowerCase().includes('http')){
                async.parallel([
                    function(nextFunc){
                        if (!offer.payout) {
                            console.log('Getting Payout from HO')
                            offersApi.getPayout(offer.id, req.body.aff_id, (err, payout) => {
                                if (!err) offer.payout = payout
                                nextFunc()
                            })
                        } else {
                            if (req.body.ignoreHO && req.body.ignoreHO.approve)
                                setTimeout(() => {nextFunc()}, 0)
                            else {
                                console.log('setting Payout to HO')
                                offersApi.setPayout(offer.id, req.body.aff_id, offer.payout, (err) => {
                                    nextFunc()
                                })
                            }
                        }
                    },
        
                    function(nextFunc){
                        if (req.body.ignoreHO && req.body.ignoreHO.approve)
                            setTimeout(() => {nextFunc()}, 0)
                        else {
                            offersApi.approveAffiliate(offer.id, req.body.aff_id, (err) => {
                                if (!err) console.log('Offer', offer.id, 'is approved for aff_id', req.body.aff_id)
                                nextFunc()
                            })
                        }
                    }
                ],function(){
                    nextOffer()
                })
            } else nextOffer()
        },function(){
            next()
        })
    }
}

