const express = require('express');
const app = express();
const port = process.env.PORT || 8080;
const i18n = require('i18n-abide');
const cookieParser = require('cookie-parser')
const bodyParser = require('body-parser')
const norobot = require('norobot');
const path = require('path')
const mysql = require('mysql');
const assets = require('express-asset-versions')
const autoprefixer = require('express-autoprefixer')({ browsers: 'last 4 versions', grid: true })

const offersApi = require('./app/modules/offersApi.js')
const mws = require('./app/modules/mws.js')(app)
const supportedLanguages = ['en', 'fr', 'de', 'ru', 'nl', 'es', 'ko']

try {
    app.rotators = require('./app/json/rotators.json');
} catch(e) {
    app.rotators = {}
}


// MySQL ======================================================================

app.db = mysql.createConnection({
    host: process.env.MYSQL_PRIVATELAND_URL,
    port: 3306,
    user: process.env.MYSQL_PRIVATELAND_USER,
    password: process.env.MYSQL_PRIVATELAND_PASSWORD,
    database: process.env.MYSQL_PRIVATELAND_DB
});
  
  app.db.connect(function(err) {
      if (err) console.log(err);
      console.log("Connected!");
  });
  


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


// Offer Type ======================================================================

app.use(mws.setOfferType);


// Static Files ======================================================================

// AutoPrefix on live traffic only
app.use(function(req, res, next){
    if (req.offerType !== 'LOCAL') {
        autoprefixer(req, res, next)
    } else next()
});

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

// if (process.env.NODE_ENV === 'development')
//     offersApi.createNewOffers()