const fs = require("fs")
let backgrounds = {}

module.exports = (req, res, next) => {
    let os
    if (req.params.os) {
        os = req.params.os
        if (os.toLowerCase() === 'ios')
            os = 'iOS'
        else if (os.toLowerCase().includes('mac'))
            os = 'Mac OS'
        else
            os = os.charAt(0).toUpperCase() + os.slice(1);
    } else if (req.userAgent && req.userAgent.os && req.userAgent.os.name)
        os = req.userAgent.os.name
    else
        os = 'Windows'

    console.log(os)
   
    var backgrounds = {
        "windows": "/device-windows",
        "android": "/device-android",
        "rim": "/device-blackberry",
        "blackberry": "/device-blackberry",
        "tizen": "/device-smart-tv",
        "webos": "/device-smart-tv",
        "nintendo": "/device-nintendo",
        "playstation": "/device-playstation",
        "linux": "/device-linux",
        "mint": "/device-linux",
        "mageia": "/device-linux",
        "joli": "/device-linux",
        "ubuntu": "/device-linux",
        "debian": "/device-linux",
        "suse": "/device-linux",
        "gentoo": "/device-linux",
        "arch": "/device-linux",
        "slackware": "/device-linux",
        "fedora": "/device-linux",
        "mandriva": "/device-linux",
        "centos": "/device-linux",
        "redhat": "/device-linux",
        "zenwalk": "/device-linux",
        "linpus": "/device-linux",
        "hurd": "/device-linux",
        "gnu": "/device-linux",
        "ios": "/device-iphone",
        "mac": "/device-mac",
    }

    const backgroundKey = Object.keys(backgrounds).find(key => os.toLowerCase().includes(key))
    let background = 'device-windows'
    console.log('backgroundKey', backgroundKey)

    if (backgroundKey)
        background = backgrounds[backgroundKey]

    else if (req.userAgent && req.userAgent.device && req.userAgent.device.type === "mobile")
        background =  'device-iphone'

    res.locals.os = req.os = {
        name: os,
        background: background
    }

    next()

}