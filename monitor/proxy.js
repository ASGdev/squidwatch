var proxy = {
	token: "lols",
	port: 3001,
	database: "tg"
}

const express = require('express')
var bodyParser = require('body-parser')
const app = express()

const mysql = require('mysql');
var connection = mysql.createConnection({
  host     : 'localhost',
  user     : 'root',
  password : 'dev',
  database : proxy.database
});

const { MongoClient } = require("mongodb");
const mongodbConnData = {
	host: "localhost",
	port: "27017",
	database: "squidwatch-links-pool",
	collection: "pool"
}

const mongodbClient = new MongoClient(`mongodb://${mongodbConnData.host}:${mongodbConnData.port}/`);

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

/* BEGIN Connect to storage databases */
/* MySQL (main) storage */
try {
	connection.connect();
} catch(e){
	console.error("Unable to connect to MySQL database");
	console.error(e);
	process.exit(1);
}

/* MongoDB (staged links pool) */
try {
	connectToMDB()
} catch(e){
	console.error("Unable to connect to MongoDB database");
	console.error(e);
	process.exit(1);
}

async function connectToMDB(){
	await mongodbClient.connect()
	
	mongodbConnData.collection = mongodbClient.db(mongodbConnData.database).collection(mongodbConnData.collection)
}

/* END connect to storage databases */

app.post('/error', function (req, res) {
	let label = req.body.label;
	let dt = req.body.datetime;
	let tid = req.body.workId;
  	connection.query('INSERT INTO tg (type, label, datetime, taskid) VALUES (?, ?, ?, ?)', ["error", label, dt, tid], function (error, results, fields) {
	  if (error) throw error;
	});
	res.send();
})

app.post('/info', function (req, res) {
  	let label = req.body.label;
	let dt = req.body.datetime;
	let tid = req.body.workId;
  	connection.query('INSERT INTO tg (type, label, datetime, taskid) VALUES (?, ?, ?, ?)', ["info", label, dt, tid], function (error, results, fields) {
	  if (error) throw error;
	});
	res.send();
})

app.post('/history', function (req, res) {
  	let qs = req.body.queue;
	let pl = req.body.processed;
	let dt = req.body.datetime;
	let tid = req.body.workId;
  	connection.query('INSERT INTO history (datetime, queue_size, processed_links, taskid) VALUES (?, ?, ?, ?)', [dt, qs, pl, tid], function (error, results, fields) {
	  if (error) throw error;
	});
	res.send();
})

app.post('/link', function (req, res) {
  	let lk = req.body.link;
	let dt = req.body.datetime;
	let tid = req.body.workId;
  	connection.query('INSERT INTO links (datetime, link, taskid) VALUES (?, ?, ?)', [dt, lk, tid], function (error, results, fields) {
	  if (error) throw error;
	});
	res.send();
})

app.post('/frontier', function (req, res) {
	console.log(body)
  	let lk = req.body.link;
	let pt = req.body.parent;
	let dc = req.body.decision;
	let tid = req.body.workId;
  	connection.query('INSERT INTO linkset (link, parent, included, taskid) VALUES (?, ?, ?, ?)', [lk, pt, dc, tid], function (error, results, fields) {
	  if (error) throw error;
	});
	
	// add non-included link into staged links pool for futur processing
	if(dc == 0){
	const doc = { 
		link: lk,
		source: pt,
		workId: tid,
		schemaVersion: "1"
	};
    const result = await mongodbConnData.collection.insertOne(doc);
	
	res.send();
})

app.post('/savepoint', function (req, res) {
  	let tracker = req.body.tracker;
	let queue = req.body.queue;
	let tid = req.body.workId;
	
  	connection.query('INSERT INTO savepoints (tracker, queue, taskid) VALUES (?, ?, ?)', [tracker, queue, tid], function (error, results, fields) {
	  if (error) throw error;
	});
	res.send();
})

app.post('/usage', function (req, res) {
  	let mem = req.body.mem;
	let cpu = req.body.cpu;
	let dsk_p = req.body.disk.p;
	let dsk_s = req.body.disk.s;
	let dt = req.body.datetime;
  	connection.query('INSERT INTO _usage (datetime, mem, cpu, disk_p, disk_s) VALUES (?, ?, ?, ?, ?)', [dt, mem, cpu, dsk_p, dsk_s], function (error, results, fields) {
	  if (error) throw error;
	});
	res.send();
})

app.listen(proxy.port, function () {
  console.log('Proxy listening on port ' + proxy.port)
})

