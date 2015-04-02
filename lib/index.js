var url = require('url'),
	http = require('http'),
	https = require('https'),
	querystring = require('querystring'),
	open = require('open'),
	googleapis = require('googleapis');

var SUCCESSHTML = '<html><head><title>Success</title></head><body><h1>SUCCESS</h1>' +
	'<span>Authencation success</span>' +
	'<p> You can close this window and go back to the ' +
	'terminal</p></body></html>',
	DEFAULT_PORT = 80,
	oauth2Client;

// Client ID and client secret are available at
// https://code.google.com/apis/console

var getRedirectUrl = function (options) {
	var redirectUrl;
	if (options.redirectUrl) {
		redirectUrl = options.redirectUrl;
	} else {
		redirectUrl = options.port ? ('http://localhost:' + options.port + '/') : 'http://localhost:' + DEFAULT_PORT;
	}
	return redirectUrl;

};

var generateNewAuthServer = function (oauth2Client, html,  callback) {
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
	return codeServer;
};

module.exports = function (scopes, options, callback) {

	var client_secret = options.client_secret,
		client_id = options.client_id,
		refresh_token = options.refresh_token,
		html = options.html || SUCCESSHTML,
		port = options.port || DEFAULT_PORT,
		redirectUrl = getRedirectUrl(options),
		OAuth2Client = googleapis.OAuth2Client,
		codeServer,
		grantUrl;

	if (!client_id || !client_secret) {
		callback(new Error('client_id and client_secret must be provided.', module.__filename__));
	}

	if (refresh_token) {
		oauth2Client.setCredentials({
  			refresh_token: refresh_token
		});
		// generate refresh token
		oauth2Client.refreshAccessToken(function(err, tokens) {
			console.log('tokens are');
			console.log(JSON.stringify(tokens));
		});
	} else {
		// generate client, start server and open grant access page
		oauth2Client = new OAuth2Client(client_id, client_secret, redirectUrl);

		// start sever for redirect
		codeServer = generateNewAuthServer(oauth2Client, html, callback);
		codeServer.listen(port);

		// generate consent page url
		grantUrl = oauth2Client.generateAuthUrl(scopes);
		console.log('Visit the url to get tokens: ', grantUrl);
		open(grantUrl);
	}

};