// server.js

// modules =================================================
var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var methodOverride = require('method-override');
var mongoose = require('mongoose');
var Nerd = require('./app/models/nerd');
var SpotifyWebApi = require('spotify-web-api-node');

var spotifyApi = new SpotifyWebApi({
    clientId: 'f8955a3bc9014747ab7e5ae8749e61c7',
    clientSecret: '5fed76b9b5414a61b7dbfda4fd4b3dbf',
    redirectUri: 'http://localhost:8080/api/callback',
    state: 'some-state-of-my-choice',
    scopes: ['user-read-private', 'user-read-email']
});

var scopes = ['user-read-private', 'user-read-email'],
    redirectUri = 'http://localhost:8080/api/callback',
    state = 'some-state-of-my-choice';

// Create the authorization URL
var authorizeURL = spotifyApi.createAuthorizeURL(scopes, state);

// https://accounts.spotify.com:443/authorize?client_id=5fe01282e44241328a84e7c5cc169165&response_type=code&redirect_uri=https://example.com/callback&scope=user-read-private%20user-read-email&state=some-state-of-my-choice
console.log(authorizeURL);

var authorizationCode = '';

// configuration ===========================================

// config files
var db = require('./config/db');

// set our port
var port = process.env.PORT || 8080;

// connect to our mongoDB database 
// (uncomment after you enter in your own credentials in config/db.js)
mongoose.connect(db.url);

// get all data/stuff of the body (POST) parameters
// parse application/json 
app.use(bodyParser.json());
app.use(bodyParser.json({ type: 'application/vnd.api+json' }));
app.use(bodyParser.urlencoded({ extended: true }));
// app.use(methodOverride('X-HTTP-Method-Override'));  

// routes ==================================================
// require('./app/routes')(app); // configure our routes
var router = express.Router();

router.use(function (req, res, next) {
    console.log('Something is happening.');
    next(); // Go to the next route
});

router.get('/', function (req, res) {
    res.json({ message: 'welcome to the API!' });
});

// routes for nerds
router.route('/nerds')
    .post(function (req, res) {
        var nerd = new Nerd();
        nerd.name = req.body.name;

        console.log('Nerd created with name ' + nerd.name);

        nerd.save(function (err) {
            if (err)
                res.send(err);
            res.json({ message: 'Nerd created!' });
        });
    })

    .get(function (req, res) {
        Nerd.find(function (err, nerds) {
            if (err)
                res.send(err);

            res.json(nerds);
        });
    });

router.route('/nerds/:nerd_id')

    .get(function (req, res) {
        Nerd.findById(req.params.nerd_id, function (err, nerd) {
            if (err)
                res.send(err);

            res.json(nerd);
        });
    })

    .put(function (req, res) {
        Nerd.findById(req.params.nerd_id, function (err, nerd) {
            if (err)
                res.send(err);

            nerd.name = req.body.name;

            nerd.save(function (err) {
                if (err)
                    res.send(err);

                res.json({ message: 'Nerd Updated!' });
            });
        });
    })

    .delete(function (req, res) {
        Nerd.remove({
            _id: req.params.nerd_id
        }, function (err, nerd) {
            if (err)
                res.send(err);

            res.json({ message: 'Successfully deleted' });
        });
    });

var artistData = {};

router.route('/callback')
    .get(function (req, res) {
        authorizationCode = req.query.code;
        // res.send({ message: 'Authorization code set to ' + authorizationCode });
        console.log('Authorization Code set to ' + authorizationCode);
        // First retrieve an access token
        spotifyApi.authorizationCodeGrant(authorizationCode)
            .then(function (data) {
                console.log('Retrieved access token', data.body['access_token']);

                // Set the access token
                spotifyApi.setAccessToken(data.body['access_token']);

                // Use the access token to retrieve information about the user connected to it
                return spotifyApi.getMe();
            })
            .then(function (data) {
                // "Retrieved data for Faruk Sahin"
                console.log('Retrieved data for ' + data.body['display_name']);

                // "Email is farukemresahin@gmail.com"
                console.log('Email is ' + data.body.email);

                // "Image URL is http://media.giphy.com/media/Aab07O5PYOmQ/giphy.gif"
                console.log('Image URL is ' + data.body.images[0].url);

                // "This user has a premium account"
                console.log('This user has a ' + data.body.product + ' account');

                spotifyApi.addTracksToPlaylist('126414982', '4jlamrVXbrl2pqVuJEsMRD', '2UREu1Y8CO4jXkbvqAtP7g')
                    .then(function (data) {
                        // console.log("Added track to playlist!");
                        console.log("User data: " + data);
                        res.send(data);
                    }, function (err) {
                        console.log("Something went wrong :(", err);
                        // res.send(err);
                    });
            })
            .catch(function (err) {
                console.log('Something went wrong: ', err.message);
            });
    });

router.route('/spotify')

    .get(function (req, res) {
        spotifyApi.getMe()
            .then(function (data) {
                //   artistData = data;
                res.json(data);
                console.log(data.body);
            }, function (err) {
                console.log('Something went wrong!', err);
                res.send(err);
            });

        router.route('/spotify/search/:search_term')
            .get(function (req, res) {
                spotifyApi.searchTracks(req.query.name, function (err, data) {
                    if (err) {
                        console.error('Something went wrong', err.message);
                        return;
                    }
                    res.json(data.body.tracks.items);
                });
            });

    });

router.route('/spotify/song/:song_id')
    .post(function (req, res) {
        spotifyApi.addTracksToPlaylist('126414982', '4jlamrVXbrl2pqVuJEsMRD', ["spotify:track:4iV5W9uYEdYUVa79Axb7Rh"])
            .then(function (data) {
                console.log("Added track to playlist!");
            }, function (err) {
                console.log("Something went wrong :(", err);
                res.send(err);
            });
    });

// Register routes
app.use('/api', router);

app.use(express.static(__dirname + '/public'));

// start app ===============================================
app.listen(port);
console.log('Magic happens on port ' + port);
exports = module.exports = app;