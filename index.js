const express = require('express')
const pug = require('pug')
const mail = require('nodemailer')
const sqlite3 = require('sqlite3').verbose()
const dotenv = require('dotenv').config()
const bodyparser = require('body-parser')

const db = new sqlite3.Database('db.db')
const app = express()

const transport = mail.createTransport({
	service: process.env.NODEMAILER_SERVICE,
	auth: {
		user: process.env.NODEMAILER_USER,
		pass: process.env.NODEMAILER_PASS
	}
})

app.set('view engine', 'pug')
app.set('views', __dirname + '/public/views')

app.use(express.static(__dirname + '/public'))
app.use(express.static(__dirname + '/node_modules/bootstrap/dist'))

db.serialize(function() {
	db.run("DROP TABLE IF EXISTS user")
	db.run("CREATE TABLE IF NOT EXISTS user (id TEXT, name TEXT, email TEXT)")
	
	var stmt = db.prepare("INSERT INTO user VALUES(?, ?, ?)")
	stmt.run("800987214", "Tyler Winkler", "tsw730@gmail.com")
	
	stmt.finalize()
})

app.get('/', (req, res) => res.sendFile(__dirname + "/public/index.html"))

app.get('/report', function (req, res) {
	db.serialize(function() {
		var stmt = db.prepare("SELECT name, email FROM user WHERE id = ?")
		stmt.get(req.query.qrEntry, function(err, row) {
			var name = row.name
			var email = row.email
			res.render('report', {title:'Report', name:name, email:email})
			
			const options = {
				from: process.env.NODEMAILER_USER,
				to: email,
				subject: 'Your device has been found',
				text: 'Hi, ' + name + '. Your device has been found. Please go to the Student Union to claim.'
			}
			
			if (process.env.NODEMAILER_SEND_MAIL == true) {
				transport.sendMail(options, function(err, info) {
					if (err) {
						console.log(err);
					} else {
						console.log('Email sent: ' + info.response);
					}
				})	
			}			
		})
		stmt.finalize()
	})	
})

app.listen(process.env.LISTEN_PORT, () => console.log(`app listening on port ${process.env.LISTEN_PORT}!`))