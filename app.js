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
const supportedLanguages = ['en', 'fr', 'de', 'ru', 'nl', 'es', 'ko']

try {
    app.rotators = require('./app/json/rotators.json');
} catch(e) {
    app.rotators = {}
}



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
    default_lang: 'en',
    translation_directory: __dirname + '/i18n',
    locale_on_url: true
}));

// Static Files ======================================================================

// AutoPrefix on live traffic only
// app.use(function(req, res, next){
//     if (process.env.NODE_ENV !== 'LOCAL') {
//         autoprefixer(req, res, next)
//     } else next()
// });

// serving static files + versioning mechanism
var assetPath = path.join(__dirname, 'assets');
const cacheTime = 30 * 24 * 60 * 60 * 1000 /* 30 Days */
app.use(express.static(assetPath, {maxAge: cacheTime }));
app.use('/assets', express.static(assetPath, {maxAge: cacheTime }));
app.use(assets('/assets', assetPath));


// MiddleWares ======================================================================

app.use(mws.setVariables);
// app.use(mws.forceCoupon('bf1643'))
app.use(mws.rotatorIdCheck)
app.use(mws.languageRedirects);
// app.use(mws.setFakeCookie);

// routes ======================================================================
require('./app/routes.js')(app); // load our routes and pass in our app and fully configured passport

// launch ======================================================================
app.listen(port, '0.0.0.0', function () {
    console.log('app listening on port ' + port + '!')
})