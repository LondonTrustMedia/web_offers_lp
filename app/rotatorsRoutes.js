
module.exports = function (app) {
    const dbQueries = require('./modules/dbQueries.js');



    // setTimeout(() => {
    //     dbQueries.rotators.updateCache((err, rotators) => {
    //         if (!err) {
    //             app.rotators = rotators
    //             console.log("Rotators Cache Updated")
    //         }
    //     })
    // }, 5000)

    // setInterval(function(){
    //     dbQueries.rotators.updateCache((err, rotators) => {
    //         if (!err) {
    //             app.rotators = rotators
    //             console.log("Rotators Cache Updated")
    //         }
    //     })
    // }, 60000)
    
    // dbQueries.rotators.delete('test_24nkf23', (err) => {
    //     if (err) console.log(err)
    // })

    app.get('/rotator', function ( req, res ) {
        dbQueries.rotators.getAll((err, newRotators) => {
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
        console.log(req)
        const isNew = req.body.edit === '0'
        if (isNew){
            console.log(req.body)
            dbQueries.rotators.new(req.body, (err) => {
                if (err) {
                    console.log(err)
                    res.json(err)
                    res.end()
                } else
                    res.end()
            })
        } else {
            dbQueries.rotators.edit(req.body, (err) => {
                if (err) {
                    console.log(err)
                    res.json(err)
                    res.end()
                } else
                    res.end()
            })

        }
    });

    app.delete('/rotator', function ( req, res ) {
        console.log('Deleting', req.body.id)

        dbQueries.rotators.delete(req.body.id, (err) => {
            if (err) {
                console.log(err)
                res.json(err)
                res.end()
            } else
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
            offer.id = offer.offerName
            
            
            offer.local = false
            offer.link = offer.offerName
            offer.offerName = offer.offerName.replace('http://', 'https://')
            // if (!offer.offerName.includes('aff_id')) 
            //     offer.offerName.includes('?') ? offer.link += '&aff_id=' + req.body.aff_id : offer.link += '?aff_id=' + req.body.aff_id
            if (offer.params) 
                offer.link += '?' + offer.params

            return offer
        })
        next()
    }
}

