module.exports = (req) => {
    if (req.path !== "" && req.path !== "/" &&
    
        // Our Hostnames only
        (   req.hostname.includes('privateinternetaccess.com') ||
            req.hostname.includes('offers-lp.piaservers')

        ) &&

        // Undefined
        (req.pageName !== 'undefined' && req.pageName !== undefined && !req.pageName.includes(undefined)) &&

        !(req.userLocation && (

            // IP Blacklist
            req.userLocation.ip === '98.170.206.202' ||
            req.userLocation.ip === '85.17.24.66' ||
            req.userLocation.ip === '81.180.227.170' ||
            req.userLocation.ip === '85.9.3.46' ||
            req.userLocation.ip === '81.218.112.166' ||

            // Bots
            req.userLocation.isp === 'Googlebot' ||
            req.userLocation.org === 'Googlebot' ||
            req.userLocation.isp === 'Microsoft bingbot' ||
            req.userLocation.org === 'Microsoft bingbot' ||
            req.userLocation.isp === 'Comcast Cable' ||
            req.userLocation.org === 'Comcast Cable'
            )
        ) &&

        // Path includes
        !req.path.includes('favicon') &&
        !req.path.includes('apple-touch-icon') &&
        !req.path.includes('touch-icon-iphone') &&
        !req.path.includes('touch-icon-ipad') &&
        !req.path.includes('apple-app-site-association') &&
        !req.path.includes('ui-icons') &&
        !req.path.includes('does_not_exist') &&
        !req.path.includes('testpage') &&
        !req.path.includes('CG-flash.js') &&
        !req.path.includes('adclear') &&
        !req.path.includes('old_torrent.css') &&
        !req.path.includes('old_torrent.css') &&
        !req.path.includes('releases/v5.2.0') &&
        !req.path.includes('webfonts') &&
        !req.path.includes('iframe_checklist') &&
        !req.path.includes('chrome-extension:') &&
        !req.path.includes('wp-admin') &&
        !req.path.includes('images/') &&
        !req.path.includes('2d.fillStyle') &&
        
        // Unsupported files
        !req.path.includes('.php') &&
        !req.path.includes('.txt') &&
        !req.path.includes('.rar') &&
        !req.path.includes('.tar.gz') &&
        !req.path.includes('.zip') &&
        !req.path.includes('.sql') &&
        !req.path.includes('.xml') &&
        !req.path.includes('.woff') &&
        
        // Page Name
        req.pageName !== '404javascript.js' &&
        req.pageName !== 'rss' &&
        req.pageName !== '404' &&
        req.pageName !== '&quot' &&
        req.pageName !== 'No%20ads'

    ) return true
    else return false
}