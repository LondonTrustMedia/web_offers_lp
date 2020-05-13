const request = require('request');
const fs = require('fs')

const serversgApi = module.exports = {

    getLiveData: function(callback) {

        var options = {
            url: 'https://www.privateinternetaccess.com/vpninfo/servers',
            headers: {
                'Content-type': 'json/text'
            }
          };
        request.get(options, function(err, response, body){
            // console.log(response)
            if (err || !body || response.statusCode !== 200) {
                if (response) console.log("response status code:", response.statusCode)
                console.log('can\'t get user ZM data:')
                callback(err || body || response)
            } else {
                const data = JSON.parse(body.split('\n')[0])
                console.log(data)
                const serversCount = Object.keys(data).length
                const locationsCount = Object.keys(data).length
                const countries = []
                Object.keys(data).forEach(server => {
                    if (data[server].country && !countries.includes(data[server].country)) countries.push(data[server].country)
                });

                // get countries list
                // console.log(countries)
                // const geos = []
                // const iso = require('../json/countries-iso.json')
                // countries.forEach(geo => {
                //     geos.push(iso.find(i => i.code === geo))
                // })
                // fs.writeFileSync('./ZM-COUNTRIES.json', JSON.stringify(geos))
                console.log('serversCount', serversCount)
                console.log('countriesCount', countries.length)
                console.log('locationsCount', locationsCount)

                callback(null, serversCount, countries.length, locationsCount)
            }
        })
    },


}
