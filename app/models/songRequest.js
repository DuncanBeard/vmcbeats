var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var SongRequestSchema = new Schema({
    name : {type : String, default: ''}
});

module.exports = mongoose.model('SongRequest', SongRequestSchema);