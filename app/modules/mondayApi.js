const request = require("request");
const async = require("async");

const pageLang = require("./../json/pageLangs.json");

const api_key = "aea67a41d72ece012cddbb9a77ef82ee";
const board_id = "397753478";
const user_ID = "3485065";

const CID_Offer_Id = 'text7'
const CID_Page_Name = 'text5'
const CID_Languages = 'text6'
const CID_Status = 'status5'


const groups = {
    OFFER: {
        url: 'https://offer.privateinternetaccess.com/',
        id: 'topics'
    },
    GOOGLE: {
        url: 'https://security.privateinternetaccess.com/',
        id: 'duplicate_of_offer___for_affil'
    },
    CPP: {
        url: 'https://maskip.co/',
        id: 'cpp___for_networks__https___ma'
    },
}


const callUrl = `https://api.monday.com/v1/boards/${board_id}.json?api_key=${api_key}`;
const getGroupsUrl = `https://api.monday.com:443/v1/boards/${board_id}/groups.json?api_key=${api_key}`;


const createPulseUrl = `https://api.monday.com:443/v1/boards/${board_id}/pulses.json?api_key=${api_key}`;
const textColumnUrl = function (column_id) {
    return `https://api.monday.com:443/v1/boards/${board_id}/columns/${column_id}/text.json?api_key=${api_key}`;
}
const statusColumnUrl = `https://api.monday.com:443/v1/boards/${board_id}/columns/${CID_Status}/status.json?api_key=${api_key}`;
const moveGroupUrl = `https://api.monday.com:443/v1/boards/${board_id}/pulses/move.json?api_key=${api_key}`;


const setMondayOffer = module.exports = function (type, page, offerId, callback) {
    const url = groups[type].url + page.path

    request({
        method: "POST",
        uri: createPulseUrl,
        json: {
            user_id: user_ID,
            pulse: {
                name: url
            }
        }
    }, function (error, response, body) {
        
        if (!error && (response.statusCode == 201 || response.statusCode == 200)) {
            // console.log("-----pulse created-----");
            var pulse_id = response.body.pulse.id;
            // console.log("pulse id: " + pulse_id);

            async.waterfall([

                // Set Offer ID Column
                function (next) {
                    if (type !== 'SECURITY') {
                        var url = textColumnUrl(CID_Offer_Id)
                        var text = offerId
                        updateTextColumn(url, pulse_id, text, (err) => {
                            if (err) next(err)
                            else {
                                // console.log("success updating offer id: " + text)
                                next()
                            }
                        })
                    } else next()
                },

                // Set Page Name Column
                function (next) {
                    var url = textColumnUrl(CID_Page_Name)
                    var text = page.name
                    updateTextColumn(url, pulse_id, text, (err) => {
                        if (err) next(err)
                        else {
                            // console.log("success updating page name: " + text)
                            next()
                        }
                    })
                },

                // Set Language Column
                function (next) {
                    var url = textColumnUrl(CID_Languages)
                    if (pageLang[page.path]) {
                        var text = pageLang[page.path].button_type.toUpperCase()

                    } else {
                        console.log('NO LANGUAGE YET - Updating with ALL')
                        var text = 'ALL'
                    }

                    updateTextColumn(url, pulse_id, text, (err) => {
                        if (err) next(err)
                        else {
                            // console.log("success updating language: " + text)
                            next()
                        }
                    })
                },

                // Set Status Column
                function (next) {
                    updateStatusColumn(statusColumnUrl, pulse_id, (err) => {
                        if (err) next(err)
                        else {
                            // console.log('success setting status column to "Live"')
                            next()
                        }
                    });
                },

                // Move Pulse to proper group
                function (next) {
                    movePulse(moveGroupUrl, pulse_id, groups[type].id, (err) => {
                        if (err) next(err)
                        else {
                            // console.log('success moving pulse to ' + type)
                            next()
                        }
                    });
                },

            ], function (err) {
                if (err) 
                    console.log(err);
                else {
                    console.log('Success Updating New Offer in Monday -', page.name, ' | type:', type);
                    callback()
                }
            })

        } else {
            console.log("statusCode: " + response ? response.statusCode : null);
            console.log(error || body);
            callback(error || body)
        }
    });
}

function movePulse(url, id, board, callback) {
    request({
        method: "POST",
        uri: url,
        json: {
            user_id: user_ID,
            group_id: board,
            pulse_ids: id
        }
    }, function (error, response, body) {
        if (!error && (response.statusCode == 201 || response.statusCode == 200)) {
            // console.log('success Moving Column')
            callback()
        } else {
            console.log("statusCode: " + response ? response.statusCode : null);
            console.log(error || body);
            callback(error || body)
        }
    }
    );
}

function updateStatusColumn(url, id, callback) {

    request({
        method: "PUT",
        uri: url,
        json: {
            pulse_id: id,
            color_index: '1'
        }
    }, function (error, response, body) {
        if (!error && (response.statusCode == 201 || response.statusCode == 200)) {
            // console.log('success Updating Status Column')
            callback()
        } else {
            console.log("statusCode: " + response ? response.statusCode : null);
            console.log(error || body);
            callback(error || body)
        }
    }
    );
}

function updateTextColumn(url, id, text, callback) {
    request({
        method: "PUT",
        uri: url,
        json: {
            pulse_id: id,
            text: text
        }
    }, function (error, response, body) {
        if (!error && (response.statusCode == 201 || response.statusCode == 200)) {
            // console.log('success Updating Text Column')
            callback()
        } else {
            console.log("statusCode: " + response ? response.statusCode : null);
            console.log(error || body);
            callback(error || body)
        }
    }
    );
}