var proxy = {
	token: "lols",
	port: 3001,
	database: "tg"
}

const express = require('express')
var bodyParser = require('body-parser')
const app = express()
const mysql = require('mysql');

app.use(bodyParser.json())
app.use(function(req, res, next){
	let rt = req.header('apikey');
        if(rt){
		if (rt == proxy.token){
			next();
		} else {
			console.log("API KEY mismatch");
			res.status('401').send();
		}
	} else {
		console.log("API KEY mismatch");
		res.status('401').send();
	}
	
	
})

app.post('/error', function (req, res) {
	console.log(req.body)
	res.send();
})

app.post('/info', function (req, res) {
  	console.log(req.body)
	res.send();
})

app.post('/history', function (req, res) {
  	console.log(req.body)
	res.send();
})

app.post('/link', function (req, res) {
  	console.log(req.body)
	res.send();
})

app.post('/usage', function (req, res) {
  	console.log(req.body)
	res.send();
})

app.get('/test', (req,res) => {
	res.send("continued");
});


app.listen(proxy.port, function () {
  console.log('Proxy listening on port ' + proxy.port)
})

