module.exports = function (app) {


// Old Pages ======================================================================

    // Redirect old pages to Flash Night
    app.get(
        ['/everyone-needs-protection*', '/trust'],
        function ( req, res ) {
            if (!req.search)
                req.search = ''
            res.redirect(301, req.protocol + '://' + req.fixedHost + '/trusted-vpn' + req.search)
        }
    );


    app.get(
        ['/unblock'],
        function ( req, res ) {
            if (!req.search)
                req.search = ''
            res.redirect(301, req.protocol + '://' + req.fixedHost + '/streaming' + req.search)
        }
    );

    app.get(
        ['/privacy'],
        function ( req, res ) {
            if (!req.search)
                req.search = ''
            res.redirect(301, req.protocol + '://' + req.fixedHost + '/online-privacy' + req.search)
        }
    );

    app.get(
        ['/protect*'],
        function ( req, res ) {
            if (!req.search)
                req.search = ''
            res.redirect(301, req.protocol + '://' + req.fixedHost + '/safe-wifi' + req.search)
        }
    );

    app.get(
        ['/top-vpn-:geocode'],
        function ( req, res ) {
            if (!req.search)
                req.search = ''
            res.redirect(301, req.protocol + '://' + req.fixedHost + '/best-vpn-' + req.params.geocode + req.search)
        }
    );

}

