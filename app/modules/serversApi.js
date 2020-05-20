const request = require('request');
const fs = require('fs')

const serversgApi = module.exports = {

    getLiveData: function(callback) {

        var options = {
            url: 'https://www.privateinternetaccess.com/vpninfo/regions_count'
          };
        request.get(options, function(err, response, body){
            // console.log(response)
            if (err || !body || response.statusCode !== 200) {
                if (response) console.log("response status code:", response.statusCode)
                console.log('can\'t get user PIA data:')
                callback(err || body || response)
            } else {
                const data = JSON.parse(body)
                // console.log(data)
                const serversCount = data.servers
                const countriesCount = data.countries
                const locationsCount = data.locations
                
                console.log('serversCount', serversCount)
                console.log('countriesCount', countriesCount)
                console.log('locationsCount', locationsCount)

                callback(null, serversCount, countriesCount, locationsCount)
            }
        })
    },

    getCountries: function(callback) {

        var options = {
            url: 'https://www.privateinternetaccess.com/vpninfo/servers'
          };
        request.get(options, function(err, response, body){
            // console.log(response)
            if (err || !body || response.statusCode !== 200) {
                if (response) console.log("response status code:", response.statusCode)
                console.log('can\'t get user PIA data:')
                callback(err || body || response)
            } else {
                try {
                    const data = JSON.parse(body.split('\n')[0])
                    // console.log(data)
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
                    console.log('countries', countries)
                    callback(null, countries)

                } catch(err) {
                    console.log('can\'t get user PIA data:')
                    callback(err)

                }
            }
        })
    }


}
