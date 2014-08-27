var express 		= require('express.io');
var app 			= express();
var request 		= require('request');
var moment 			= require('moment');
var _ 				= require('lodash');
var fs				= require('fs');
var http			= require('http');
var mongoose		= require('mongoose');
var connect 		= require('connect');
var json 			= require('json');
var bodyParser = require('body-parser')
var csv = require("fast-csv");

/*
csv.fromPath("navcodes.csv").on("record", function(data){ 
	var navcodes = data[0].substring(1, data[0].length-1).split(',');
	var id = data[1];
	var color = data[2];
	var s1 = data[3];
	var s2 = data[4];
	var s3 = data[5];
	var side = data[6];
	console.log(codes);
})
.on("end", function() { 
		console.log("done");});

*/


/**
 * Randomize array element order in-place.
 * Using Fisher-Yates shuffle algorithm.
 */
function shuffleArray(array) {
    for (var i = array.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var temp = array[i];
        array[i] = array[j];
        array[j] = temp;
    }
    return array;
}

//////////////////////////////////
// Express app config
/////////////////////////////////

app.engine('ejs', require('ejs-locals'));//.renderFile);
app.set('port', (process.env.PORT || 5000))
app.use(express.static(__dirname + '/public'))
// app.use(express.bodyParser());
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.set('view options', {layout: "template.html"});
app.http().io();

/********************* MONGOOSE INIT ****************************/

mongoose.connect('mongodb://nexus:5@kahana.mongohq.com:10084/greet');

var db = mongoose.connection;

// Error handling
db.on('error', console.error.bind(console, 'connection error:'));

db.once('open', function callback() {
  console.log('Connected to DB');
});

var User = mongoose.model('User', {
	name 				: String,
	number 			: Number,
});

var Event = mongoose.model('Event', {
	from 				: String,
	to 					: String,
	type 				: String,
	date				: String,
	memo 				: String
});


// Facebook INIT
//appId = 1457379081194444;
//appSecret = "9838903221f77bc33f9f8dfe1f286089";

//////////////////////////////////
// Express handlers
/////////////////////////////////


app.get('/', function(req, res) {
	
	res.render('who');
});

app.post('/start', function(req, res){
	var contacts = req.body.contacts;
	console.log(contacts);
	return "true"
});



/*
app.get('/facebook/login/callback', function(req, res){
	var code = req.query.code;
    var url1 = "https://graph.facebook.com/oauth/access_token?client_id=" + appId + "&redirect_uri=http://localhost:5000/facebook/login/callback&client_secret=" + appSecret + "&code=" + code;   
    request(url1, function (error, response, body) {
    if(error) {
      console.log(error);
      return null;
    }
    else {
      var body1 = querystring.parse(body);
      var url2 = "https://graph.facebook.com/oauth/access_token?grant_type=fb_exchange_token&client_id=" + appId + "&client_secret=" + appSecret + "&fb_exchange_token=" + body1.access_token;
      request(url2, function (error, response, body) {
        if(error) {
          console.log(error);
          callback(null);
        }
        else {

          
          var body2 = querystring.parse(body);
          console.log(body2);
          //callback(body);
      	}
      });
  	}
  });
})
*/
app.post('/contact', function(req, res){
	//var contacts = req.body.contacts;
	console.log(req.body);
	return "true"
});
app.get('/create', function(req, res) {
	res.render('create')
});

app.get('/newjob', function(req, res) {
	res.render('createjob');
})
app.post('newjob', function(req, res) {
	var description = req.body.description;
	var question 	= req.body.question;
	var labels 	 	= req.body.labels;
	var answers  	= req.body.answers;
	var max 	 	= req.body.max;
	var job = new Job({
		'description' 	: description,
		'question'		: question,
		'labels'  		: labels,
		'answers' 		: answers,
		'max'	  		: max});
	job.save(function(err) {
		var labelsLength = labels.length;
		var answersLength = answers.length;
		for(var i = 0; i < labelsLength.length; i++) {
			for(var m = 0; m < 5; m++) {
				var potentialAnswers = [];
				for(var n = 0; n < 4; n++) {
					potentialAnswers.push(answers[Math.floor(Math.random() * answersLength)]);
				}
				var task = new Task({
					'jobId' 			: jobObj['_id'],
					'question'  		: question,
					'label'				: labelsLength[i],
					'answers'			: potentialAnswers,
					'completed'			: 'false',
					'answer'			: 'false'
				});
				task.save(function(err) {

				});
			}
		};
	});

});

app.get('/job/:jobId', function(req, res) {
	var jobId = req.param('jobId');
	//var thisJob = Job.findOne({'_id': jobId});
	Task.find({jobId : jobId}, function(err, tasks) {
		var allTasks = [];
		for(var i = 0; i < tasks.length; i++ ) {
			console.log(tasks[i].answers)
			var newObj = {};
			newObj.completed = tasks[i]['completed'];
			newObj.question = tasks[i]['question'];
			newObj.answers  = tasks[i].answers;
			newObj.label    = tasks[i].label;
			newObj.jobId	= tasks[i].jobId;
			newObj.taskId       = tasks[i].taskId;
			allTasks.push(newObj);
		}
		var theseTasks = shuffleArray(allTasks);
		//console.log(allTasks);
		res.render('questions', {
			tasks : JSON.stringify(theseTasks)
		});
	});
});

app.post('/completedtask', function(req, res) {
	console.log(req.body);
	var taskId = req.body.taskId;
	var answer = req.body.answer;
	console.log(answer);
	Task.update({'id' : taskId}, {answer : answer, completed : true}, function() {
		var task = new CompletedTask({
			'taskId' : taskId,
			'answer' : answer
		});
		task.save(function(err) {

		});
	});
	
	res.end()
	

});

app.get('/dashboard/:jobId', function(req, res) {
	var jobId = req.param('jobId');
	CompletedTask.find({jobId : jobId}, function(err, cTasks) {

	})
	res.render('dashboard', {
		tasks : tasks
	});
});

app.listen(app.get('port'), function() {
  console.log("Node app is running at localhost:" + app.get('port'))
});

