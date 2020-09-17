var osu = require('node-os-utils')
var cpu = osu.cpu
var drive = osu.drive
var mem = osu.mem

const request = require('request-json');
var client = request.createClient('http://localhost:3001/');

client.headers['apikey'] = 'lols';

var df = require('df');

var schedule = require('node-schedule');
 
var j = schedule.scheduleJob('*/1 * * * *', function(){
  g()
});

let packed  = {
	cpu: "",
	mem: "",
	disk: {
		p: "",
		s: ""
	}
}

async function get(){
	return new Promise((resolve, reject) => {
	    cpu.usage().then(cpuPercentage => {
		packed.cpu = cpuPercentage;
			mem.info().then(info => {
				packed.mem = info.freeMemPercentage

				df(function (err, res) {
				    if (err) {
				      
				       reject();
				    }


					res.forEach(fs => {
						if(fs.mountpoint == "/"){
							packed.disk.p = fs.percent
							packed.disk.s = fs.available	
						}					
					})

					resolve();			
				})		
			})
		})

	  });
	
}

function g(){
	get().then(d => { 
		packed.datetime = new Date().toISOString();
		console.log(packed);
		
		client.post('usage/', packed, function (error, response, body) {
		    if(error){
			console.log("[MONITOR][USAGE] Communication Error");
		    } else {
			console.log("[MONITOR][USAGE] Monitor updated");
		}
  });
	});
}


