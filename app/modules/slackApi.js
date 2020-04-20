const { IncomingWebhook } = require('@slack/client');
const requestFilter = require('./requestFilters.js');

var slackApi = module.exports = {

    errorToNitool: function(title, errText,) {
    
        var url = "https://hooks.slack.com/services/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"
        var webhook = new IncomingWebhook(url);


        var text = '\n Error: ```' + JSON.stringify(errText) + '```'

        var options = {
            "attachments": [
                {
                    "author_name": "Nitool-Bot",
                    "fallback": 'PIA HasOffers Error Alert!',
                    "title": 'PIA - ' + title,
                    "text": slackEscape(text),
                    "color": "#39b54a"
                }
            ]
        }

        webhook.send(options, function(err, res) {
            if (err) 
                console.log(err);
            else 
                console.log('Message sent to Slack');
        });
    
    },

    sendErrorMessage: function(title, errText, req) {
    
        var url = "https://hooks.slack.com/services/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"
        var webhook = new IncomingWebhook(url);


        var fullUrl = req.protocol + '://' + req.hostname + req.path + req.search
        var text = '\n Error: ```' + JSON.stringify(errText) + '```\n'
        text += '\n\n\n URL: ```' + fullUrl + '```\n'
        text += '\n Page Name: ```' + req.pageName + '```\n'
        text += '\n User Location: ```' + JSON.stringify(req.userLocation, null, 4) + '```\n'
        text += '\n User Agent: ```' + (JSON.stringify(req.userAgent, null, 4) || req.headers['user-agent'] || req.get('User-Agent')) + '```\n'
        text += '\n Referrer: ```' + req.header('Referer') + '```\n'

        var options = {
            "attachments": [
                {
                    "author_name": "Nitool-Bot",
                    "fallback": 'PIA Error Alert!',
                    "title": 'PIA ' + title,
                    "text": slackEscape(text),
                    "color": "#39b54a"
                }
            ]
        }

        if (requestFilter(req)) {
            webhook.send(options, function(err, res) {
                if (err) 
                    console.log(err);
                else 
                    console.log('Message sent to Slack');
            });
        }
    
    },

    sendFallbackMessage: function(req) {
    
        var url = "https://hooks.slack.com/services/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"
        var webhook = new IncomingWebhook(url);


        var fullUrl = req.protocol + '://' + req.hostname + req.originalUrl
        var offerId = fullUrl.replace(/.*offerId:(.*?)&.*/, '$1')
        var affId = fullUrl.replace(/.*affId:(.*?)&.*/, '$1')

        var text = '\n HasOffers Fallback: \n'
        text += '\n\n\n URL: ```' + fullUrl + '```\n'
        text += '\n Offer ID: ```' + offerId + '```\n'
        text += '\n Affiliate ID: ```' + affId + '```\n'
        text += `\n \n *Affiliate ${affId} is NOT approved to run offer ${offerId}!!* \n **Please approve it in HasOffers** \n \n `
        text += '\n User Location: ```' + JSON.stringify(req.userLocation, null, 4) + '```\n'
        text += '\n User Agent: ```' + (JSON.stringify(req.userAgent, null, 4) || req.headers['user-agent'] || req.get('User-Agent')) + '```\n'
        text += '\n Referrer: ```' + req.header('Referer') + '```\n'

        var options = {
            "attachments": [
                {
                    "author_name": "Nitool-Bot",
                    "fallback": 'PIA Fallback Alert!',
                    "title": 'PIA Fallback Alert',
                    "text": slackEscape(text),
                    "color": "#39b54a"
                }
            ]
        }

        webhook.send(options, function(err, res) {
            if (err) 
                console.log(err);
            else 
                console.log('Message sent to Slack');
        });
    
    }
}


const slackEscape = function(text) {
    return text.replace(/\&/g, '&amp;').replace(/\</g, '&lt;').replace(/\>/g, '&gt;')
}