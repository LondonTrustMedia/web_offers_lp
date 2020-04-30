const request = require('request');

var locationScan = module.exports = {

    check: function(req, res, callback) {
        if (req.ip === "::1" || req.ip === "127.0.0.1" || req.ip === "192.168.237.1"  || req.ip === "192.168.86.139") var userIP = '89.249.64.181'
        else userIP = req.ip.replace(/::ffff:/, '')
        console.log('userIP: ' + userIP)
        
        // callback();

        var options = {
            url: 'http://geolocation.cybertool.co?visitorIp=' + userIP,
            headers: {
              'Authentication': 'Jugz5ybGqr3kv!1Ks'
            }
          };
        request.get(options, function(err, response, body){
            // console.log(response)
            if (err || !body || JSON.parse(body).error) {
                console.log('can\'t get user location:')
                console.log(err || body || response)
                res.locals.userLocation = req.userLocation = {
                    ip: "",
                    cn: "",
                    cty: "",
                    rgn: "",
                    isp: "",
                    cc: ""
                }
                callback();
            } else {
                try {
                    var location = JSON.parse(body)
                    if (req.query.simulated)
                        location.cn = req.query.simulated
                    res.locals.userLocation = req.userLocation = location
                } catch(e) {
                    console.log(e)
                    console.log(body)
                }
                // console.log(body)
                console.log(req.userLocation)
                callback();
            }
        })
    }
}
