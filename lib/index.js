var TIMEOUT = 5 * 60 * 1000,
	SUCCESSHTML = '<html><head><title>Success</title></head><body><h1>SUCCESS</h1>' +
	'<span>Authencation success</span>' +
	'<p> You can close this window and go back to the ' +
	'terminal</p></body></html>',
	readline = require('readline'),
	url = require('url'),
	http = require('http'),
	path = require('path'),
	querystring = require('querystring'),
	open = require('open'),
	fs = require('fs'),
	googleapis = require('googleapis'),
	OAuth2Client = googleapis.OAuth2Client;
	oauth2Client;

// Client ID and client secret are available at
// https://code.google.com/apis/console


module.exports = function (scopes, options, callback) {

	var client_secret = options.client_secret,
		client_id = options.client_id,
		timeout = options.timeout || TIMEOUT,
		html = options.html || SUCCESSHTML,
		port = options.port || 80,
		redirectUrl;

	if (options.redirectUrl) {
		redirectUrl = options.redirectUrl;
	} else {
		redirectUrl = options.port ? ('http://localhost:' + port + '/') : 'http://localhost';
	}

	if (!client_id || !client_secret) {
		callback(new Error('client_id and client_secret must be provided.', module.__filename__));
	}

	oauth2Client = oauth2Client || new OAuth2Client(client_id, client_secret, redirectUrl);

	// Get access code
	// start sever for redirect
	var codeServer = http.createServer(function (req, res){
		var code = querystring.parse(url.parse(req.url).query).code;
		res.writeHead(200, {
			'Content-Type': 'text/html',
			'Connection': 'close'
		});
		res.write(html);
		res.end();
		process.nextTick(function (){
			codeServer.close();
			// request access token
			oauth2Client.getToken(code, function (err, tokens){
				// set tokens to the client
				oauth2Client.setCredentials(tokens);
				return callback(null, oauth2Client, tokens);
			});
		});
	});
	codeServer.maxConnections = 1;
	codeServer.listen(port);

	// generate consent page url
	var grantUrl = oauth2Client.generateAuthUrl(scopes);
	console.log('Visit the url to get tokens: ', grantUrl);
	open(grantUrl);
};