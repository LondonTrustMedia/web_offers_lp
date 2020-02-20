
$(document).ready(function() {
    $('a[href]:not(.lang):not([data-slide])').click(toCheckout);
})

function toCheckout(e) {
    e.preventDefault();
    $('body').append('<div class="loading">Loading&#8230;</div>')
    var redirectUrl = $(this).attr('href');
    var affId = getUrlParam('aff_id')

    if (affId) {
        var currentParams = window.location.search.slice(1);

        var ajaxUrl = '/offer/transaction?v=' + createRandom(8) + '&page_name=' + page_name ;
        if (currentParams && currentParams.length) {
            ajaxUrl += '&' + currentParams;
        }
        
        // console.log('ajaxUrl', ajaxUrl)
        $.getJSON( ajaxUrl, function(result) {
            result = result || {};
            // console.log(result)
            if(result.hasOwnProperty('transactionId') && result.transactionId.length) {
                if (redirectUrl.indexOf('?') !== -1)
                    redirectUrl += '&clickId=' + result.transactionId
                else
                    redirectUrl += '?clickId=' + result.transactionId

                console.log('Transaction ID: ', result.transactionId)
            }

            window.location.href = redirectUrl;

        }).fail(function(e) {
            console.log(e);
            window.location.href = redirectUrl;
        })
    } else
        window.location.href = redirectUrl;

}

//URL HELPER
function getUrlParams(url) {
    url = url || window.location.href;
    var params = {};
    var parser = document.createElement('a');
    parser.href = url;
    var query = parser.search.substring(1);
    var vars = query.split('&');
    for (var i = 0; i < vars.length; i++) {
        var pair = vars[i].split('=');
        var v = (pair[1] || '').replace(/\+/gm,"%20");
        params[pair[0]] = decodeURIComponent(v);
    }
    return params;
};

function getUrlParam(param, url) {
    var urlParams = this.getUrlParams(url);
    var urlParam = (urlParams[param] ? urlParams[param] : false);
    
    return urlParam;
};


function createRandom(length) {
	length = Number.parseInt(length) || 32;
	var validChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	var uuid = '';
	var cryptoObj = window.crypto || window.msCrypto || false; //using ms prefix for IE11
	if (cryptoObj) {
		var array = new Uint8Array(length);
		cryptoObj.getRandomValues(array);
		// dec2hex :: Integer -> String
		function dec2hex(dec) {
			return ('0' + dec.toString(16)).substr(-2)
		}
		uuid = Array.from(array, dec2hex).join('')
	}
	else {
		for (var i = 0; i < length; i++) {
			uuid += validChars.charAt(Math.floor(Math.random() * validChars.length));
		}
	}
	return uuid;
}