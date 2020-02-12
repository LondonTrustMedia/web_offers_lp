const request = require("request");
const api_key = "eyJhbGciOiJIUzI1NiJ9.eyJ0aWQiOjE4MDc3NDU3LCJ1aWQiOjM0ODUwNjUsImlhZCI6IjIwMTktMDctMTZUMDg6NTY6NDFaIiwicGVyIjoibWU6d3JpdGUifQ.x6lOKLm2D9oUL5XlXYh1jF0H9JFG8rJWgYYKywvbmHk";

const board_id = 413000065;
const CID_Offer_Id = 'text'
const CID_Link = 'link'
const CID_Languages = 'text6'
const CID_Status = 'status5'


const old_api_key = "aea67a41d72ece012cddbb9a77ef82ee";

const callUrl = `https://api.monday.com/v1/boards/413000065.json?api_key=aea67a41d72ece012cddbb9a77ef82ee`;
const getGroupsUrl = `https://api.monday.com:443/v1/boards/${board_id}/groups.json?api_key=${api_key}`;



const groups = {
    OFFER: {
        url: 'https://privateinternetaccess.com/offer/',
        id: 'topics'
    },
    // CPP: {
    //     url: 'https://cyberprivacy.pro/',
    //     id: 'duplicate_of_security___for_go'
    // },
    // SECURITY: {
    //     url: 'https://security.privateinternetaccess.com/',
    //     id: 'duplicate_of_offer___for_affil'
    // }
}


const mondayRequest =  (query) => {
    return new Promise((resolve, reject) => {
        // console.log("making a query:", query)
        request({
            method: "POST",
            uri: "https://api.monday.com/v2",
            headers: {
                "Content-Type": "application/json",
                "Authorization": api_key
            },
            json: query
        }, function (error, response, body) {
            if (body && body.error_message)
                reject(body)
            else if (!error && (response.statusCode == 201 || response.statusCode == 200)) {
                resolve(body)
            } else {
                // console.log(JSON.stringify(error || body || response, null, 4))
                reject(error || body || response)
            }
    
        })
    })
}

const setMondayOffer = module.exports = async (type, page, offerId, callback) => {

    const pageUrl = groups[type].url + page.path
    let langValue = "ALL"
    const columnValues = {}

    columnValues[CID_Link] = {
        "url": pageUrl,
        "text": pageUrl
    }

    columnValues[CID_Status] = {
        "label": "Live"
    }

    columnValues[CID_Languages] = langValue

    if (type !== 'SECURITY')
        columnValues[CID_Offer_Id] = offerId.toString()

    var query = {
        query: `
           mutation ($name: String!, $board: Int!, $group: String!, $values: JSON!) {
                create_item (item_name: $name, board_id: $board, group_id: $group, column_values: $values ) { 
                    id
                }
            }`,
        variables: { 
            "name": page.name,
            "board": board_id,
            "group": groups[type].id,
            "values": JSON.stringify(columnValues)
        }
    }
    
    try {
        const response = await mondayRequest(query)

        console.log("res:", JSON.stringify(response))
        if (response.errors && response.errors.length)
            callback(response.errors)
        else
            callback()

    } catch(err) {
        console.log(err)
        callback(err)
    }

}