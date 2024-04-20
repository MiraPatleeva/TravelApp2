let express = require('express');
let router = express.Router();

const fs = require('fs');

/* GET home page. */
//let todo = new Array(); 

//Показване на Login форма

router.get('/login', function(req, res) {

    res.render('login', {info: 'Please login into the Travel App'});

});

//Може да тестваме логин формата --> npm start или nodemon --> http://127.0.0.1:3000/todo/login

//Защо при изпращане на данните от формата възникна грешка?


//Създаване на сесия след успешен Login

session = require('express-session'); //Как да намерим информация за този модул?

router.use(session({

    secret: 'random string',

    resave: true,

    saveUninitialized: true,

}));

sqlite3 = require('sqlite3');

db = new sqlite3.Database('travel.sqlitedb');

db.serialize();

db.run(`CREATE TABLE IF NOT EXISTS travel(

    id INTEGER PRIMARY KEY,

    user TEXT NOT NULL,

    location TEXT,

    url TEXT,

    date_travel_start DATE,

    date_travel_end DATE,

    description TEXT,

    date_created TEXT,

    date_modified TEXT)`

);

db.parallelize();


fileUpload = require('express-fileupload');

router.use(fileUpload());
bcrypt = require('bcryptjs');

users = require('./passwd.json');


router.post('/login', function(req, res){

    bcrypt.compare(req.body.password, users[req.body.username] || "", function(err, is_match) {

        if(err) throw err;

        if(is_match === true) {

            req.session.username = req.body.username;

            req.session.count = 0;

            res.redirect("/travel/");

        } else {

            res.render('login', {warn: 'TRY AGAIN'});

        }

    });

});

//Може да тестваме логин формата --> http://127.0.0.1:3000/todo/login


//Logout - унищожаване на сесия

router.get('/logout', (req, res) => {

    req.session.destroy((err) => {
        if (err) {
            console.error("Error destroying session:", err);
            return res.status(500).send("Error logging out");
        }
        res.redirect("/travel/login");
    });

});

//Може в режим "Developer tools" на браузъра да проследим процеса по създаване и унищожаване на сесия - http://127.0.0.1:3000/todo/login & http://127.0.0.1:3000/todo/logout 


//Всеки потребител работи със собствен файл

//let filename = "";


router.all('*', function(req, res, next) {
	if(!req.session.username) {

        res.redirect("/travel/login");

        return;

    }
    next();

    //filename = req.session.username + ".txt";
	
	//fs.readFile(filename, (err, data) => {
		//if(err) todo = new Array();
		//else {
		//	todo = data.toString().split("\n").filter(s => s.length > 0);
		//}
		//next();
	//});
});

router.get('/', function(req, res, next) {
    req.session.count++;

var options = { timeZone: 'Europe/Sofia' };

var date = new Date().toLocaleString('en-EN', options);

    s = "Hello, " + req.session.username + "!";
	
	//res.render('todo', { info: s, todo: todo });
    try {
        db.all('SELECT id, user, location, url, date_travel_start, date_travel_end, description, date_created, date_modified FROM travel WHERE user = ? ORDER BY date_modified DESC;', [req.session.username], function(err, rows) {
            if(err) throw err;
            console.log(rows); // Log the retrieved rows
            res.render('travel', { info: s, info1:date, rows: rows });
        });
    } catch (error) {
        console.error(error);
    }
});

// router.post('/', function(req, res, next) {
// 	let q = req.body;
// 	if(q.action=="add") todo.push(q.todo);
// 	if(q.action=="del") todo.splice(q.todo, 1);
// 	if(q.action=="add" || q.action=="del") {
// 		let txt = '';
// 		for(v of todo) txt += v+"\n";
// 		fs.writeFile(filename, txt, (err) => {
// 			if (err) throw err;
// 			console.log('The file has been saved!');
// 		});
// 	}
// 	res.redirect("/todo/");
// });

//CREATErud + Picture upload

router.post('/upload',(req, res) => {

    url = "";

    if(req.files && req.files.file) {

        req.files.file.mv('./public/images/' + req.files.file.name, (err) => {

            if (err) throw err;

        });

        url = '/images/' + req.files.file.name;

    }

       

    db.run(`

        INSERT INTO travel(

            user,

            location,

            url,

            date_travel_start,

            date_travel_end,

            description,

            date_created,

            date_modified

        ) VALUES (

            ?,

            ?,

            ?,

            ?,

            ?,

            ?,

            DATETIME('now','localtime'),

            DATETIME('now','localtime'));

        `,

        [req.session.username, req.body.location || "", url,req.body.date_travel_start,req.body.date_travel_end,req.body.description],

        (err) => {

            if(err) throw err;

            res.redirect('/travel/');

        });

});


//cruDELETE

router.post('/delete', (req, res) => {

    db.run('DELETE FROM travel WHERE id = ?', req.body.id, (err) => {

        if(err) throw err;

        res.redirect('/travel/');

    });

});


//crUPDATEd

router.post('/update', (req, res) => {

    let url = ""; // Initialize url variable with the existing URL or an empty string

    if (req.files && req.files.file) {
        req.files.file.mv('./public/images/' + req.files.file.name, (err) => {
            if (err) throw err;
        });
        url = '/images/' + req.files.file.name; // Update the url variable with the new file URL
    }


    db.run(`UPDATE travel

            SET user = ?,
            
               location = ?,

                url = ?,

                date_travel_start = ?,

                date_travel_end = ?,

                description = ?,

                date_modified = DATETIME('now','localtime')

            WHERE id = ?;`,

            
        req.session.username,

        req.body.location,

        url,

        req.body.date_travel_start,

        req.body.date_travel_end,

        req.body.description,

        req.body.id,

        (err) => {

            if(err) throw err;

            res.redirect('/travel/');

    });

});


router.all('*', function(req, res) {

    res.send("No such page or action! Go to: <a href='/travel/'>main page</a>");

});



module.exports = router;
