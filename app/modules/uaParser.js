const parser = require('ua-parser-js');

var uaParse = module.exports = function(req, res, callback) {
    var ua = parser('Mozilla/5.0 (compatible; Linespider/1.1; +https://lin.ee/4dwXkTH');
    headers = ['Accept','Accept-Charset','Accept-Encoding','Accept-Language','Accept-Datetime','Authorization','Cache-Control','Connection','Cookie','Content-Length','Content-Type','Date','Expect','Expect','Origin','Pragma','Proxy-Authorization','Range','TE','Upgrade','Via','Warning','From', 'Host','Referer']
    full = {}
    for (i = 0; i < headers.length; i++) {
        var ub = parser(req.get(headers[i]));
        if (ub['ua'] !== ''){
        full[headers[i]]=ub['ua']
        }
    }
    res.locals.userAgent = req.userAgent = ua;
    req.headerParsed = full;
    callback();

}