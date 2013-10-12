var request = require('superagent');
var decode = require('base64-decode');

module.exports.load = function(){
	request.get('https://api.github.com/repos/bredele/store/contents/test/store.js', function(error, res){
		var json = JSON.parse(res.text);
		document.body.innerText = decode(json.content);
	});
};