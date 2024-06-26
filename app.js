const express = require('express');
const app = express();
const port = process.env.PORT || 8080;
const i18n = require('i18n-abide');
const cookieParser = require('cookie-parser')
const bodyParser = require('body-parser')
const norobot = require('norobot');
const path = require('path')
const assets = require('express-asset-versions')
// const autoprefixer = require('express-autoprefixer')({ browsers: 'last 4 versions', grid: true })

const mws = require('./app/modules/mws.js')(app)
const serversApi = require('./app/modules/serversApi.js')
const offersApi = require('./app/modules/offersApi.js');
const supportedLanguages = ['eng', 'fra', 'deu', 'dan', 'ita', 'jpn', 'nld', 'nor', 'por', 'rus', 'spa']
const trustpilotApi = require('./app/modules/trustpilotApi.js')

try {
    app.rotators = require('./app/json/rotators.json');
} catch(e) {
    app.rotators = {}
}

app.liveData = {
    Trustpilot: {
        trustScore: 4.1,
        trustStars: 4,
        trustNumberOfReviews: 5813,
        trustpilotReviews: {}
    },
    servers: {
        serversCount: 3314,
        countriesCount: 46,
        locationsCount: 67
    }
}

if (process.env.NODE_ENV === 'local')
    offersApi.createNewOffers()

// Settings ======================================================================

app.disable('x-powered-by');
app.enable('verbose errors');
app.enable('trust proxy');
app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');



app.use(cookieParser('NitoolWasHere'))
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())
app.use(norobot)


// Rotators API Routes ======================================================================

require('./app/rotatorsRoutes.js')(app); // rotators Routs


// Localization ======================================================================

app.use(i18n.abide({
    supported_languages: supportedLanguages,
    default_lang: 'eng',
    translation_directory: __dirname + '/i18n',
    locale_on_url: false
}));


app.use((req, res, next) => {
    if (process.env.NODE_ENV === 'local' && req.hostname.includes('localhost'))
        app.set('subdomain offset', 1);
    next()
})

// Static Files ======================================================================

// AutoPrefix on live traffic only
// app.use(function(req, res, next){
//     if (process.env.NODE_ENV !== 'LOCAL') {
//         autoprefixer(req, res, next)
//     } else next()
// });

// serving static files + versioning mechanism
// var assetPath = path.join(__dirname, 'assets');
// const cacheTime = 30 * 24 * 60 * 60 * 1000 /* 30 Days */
// app.use(express.static(assetPath, {maxAge: cacheTime }));
// app.use('/assets', express.static(assetPath, {maxAge: cacheTime }));
// app.use(assets('/assets', assetPath));


const cacheTime = 365 * 24 * 60 * 60 * 1000 /* 365 Days - 1 Year */

app.use(mws.versioning(__dirname + '/assets'));


app.use('/*/img/', express.static(__dirname + '/assets/img', {maxAge: cacheTime }));
app.use('/img/', express.static(__dirname + '/assets/img', {maxAge: cacheTime }));
app.use('css/img', express.static(__dirname + '/assets/img', {maxAge: cacheTime }));
app.use('/*/css/', express.static(__dirname + '/assets/css', {maxAge: cacheTime }));
app.use('/css/', express.static(__dirname + '/assets/css', {maxAge: cacheTime }));
app.use('/*/js/', express.static(__dirname + '/assets/js', {maxAge: cacheTime }));
app.use('/js/', express.static(__dirname + '/assets/js', {maxAge: cacheTime }));
app.use('/*/lib/', express.static(__dirname + '/assets/lib', {maxAge: cacheTime }));
app.use('/lib/', express.static(__dirname + '/assets/lib', {maxAge: cacheTime }));
app.use('/offer', express.static(__dirname + '/assets', {maxAge: cacheTime }));
app.use(express.static(__dirname + '/assets', {maxAge: cacheTime }));



// MiddleWares ======================================================================

app.use(mws.setLocaleFromSubdomain);


app.use(mws.setVariables);
// app.use(mws.forceCoupon('bf1643'))
app.use(mws.rotatorIdCheck)
// app.use(mws.languageRedirects);
// app.use(mws.setFakeCookie);

// routes ======================================================================
require('./app/oldRoutes.js')(app); // Old Pages Routes
require('./app/routes.js')(app); // load our routes and pass in our app and fully configured passport

// launch ======================================================================
app.listen(port, '0.0.0.0', function () {
    console.log('app listening on port ' + port + '!')
})

// Get Live Data ======================================================================

setInterval(() => {
    trustpilotApi.getData((err, Score, stars, numberOfReviews) => {
        if (err) {
            console.log(err);
            return;
        }
        app.liveData.Trustpilot.trustScore = Score
        app.liveData.Trustpilot.trustStars = stars
        app.liveData.Trustpilot.trustNumberOfReviews = numberOfReviews
    })

    trustpilotApi.getReviews((err, trustReviews) => {
        if (err) {
            console.log(err);
            return;
        }
        app.liveData.Trustpilot.trustpilotReviews = trustReviews
    })

    serversApi.getLiveData((err, servers, countries, locations) => {
        if (err) {
            // console.log(err);
            return;
        }
        app.liveData.servers.serversCount = servers
        app.liveData.servers.countriesCount = countries
        app.liveData.servers.locationsCount = locations
    })
}, 1800000)

trustpilotApi.getData((err, score, stars, numberOfReviews) => {
    if (err) {
        console.log(err);
        return;
    }
    app.liveData.Trustpilot.trustScore = score
    app.liveData.Trustpilot.trustStars = stars
    app.liveData.Trustpilot.trustNumberOfReviews = numberOfReviews
})

trustpilotApi.getReviews((err, trustReviews) => {
    if (err) {
        console.log(err);
        return;
    }
    app.liveData.Trustpilot.trustpilotReviews = trustReviews
})

serversApi.getLiveData((err, servers, countries, locations) => {
    if (err) {
        // console.log(err);
        return;
    }
    app.liveData.servers.serversCount = servers
    app.liveData.servers.countriesCount = countries
    app.liveData.servers.locationsCount = locations
})
