"use strict";
const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const fs = require("fs");
const databaseDir = __dirname + "/database/";

// set the port of our application
const port = process.env.PORT || 8080;

// Declare Express App
const app = express();
app.use(express.static(__dirname + "/public"));

// GET ARRAY OF ALL AVAILABLE DATABASES
app.get("/databases", function(req, res) {

	var databases = [];
	fs.readdirSync(databaseDir).forEach(file => {
		if (file.includes(".db")) {
			databases.push(file);
		}
	});
	const databasesJSON = {"databases": databases};
	res.json(databasesJSON);
});

// GET ARRAY OF ALL AVAILABLE TABLES FOR SELECTED DATABASE
app.get("/tables", function(req, res) {

	const databasePath = databaseDir + req.query.selectedDatabase;
	const database = new sqlite3.Database(databasePath, sqlite3.OPEN_READONLY);
	const sql = "SELECT name FROM sqlite_master WHERE type='table'";

	database.serialize(function() {
		database.all(sql, (err, allTables) => {
			if (err) {
				console.error(err.message);
				res.status(500);
				res.json({"error": err.message});
			} else {
				var tables = [];
				allTables.forEach((table) => {
					tables.push(table.name);
				});
				const tablesJSON = {"tables": tables};
				res.json(tablesJSON);
			}
		});
	});
	database.close();
});

// GET ARRAY OF ALL AVAILABLE COLUMNS FOR SELECTED DATABASE AND TABLE
app.get("/columns", function(req, res) {

	const databasePath = databaseDir + req.query.selectedDatabase;
	const database = new sqlite3.Database(databasePath, sqlite3.OPEN_READONLY);
	const sql = "PRAGMA table_info(" + req.query.selectedTable + ")";

	database.serialize(function() {
		database.all(sql, (err, allColumns) => {
			if (err) {
				console.error(err.message);
				res.status(500);
				res.json({"error": err.message});
			} else {
				var columns = [];
				allColumns.forEach((col) => {
					columns.push(col.name);
				});
				columns.sort();
				const columnsJSON = {"columns": columns};
				res.json(columnsJSON);
			}
		});
	});
	database.close();
});

// GET DATA FOR SELECTED DATABASE, TABLE, AND COLUMN
app.get("/data", function(req, res) {

	const databasePath = databaseDir + req.query.selectedDatabase;
	const database = new sqlite3.Database(databasePath, sqlite3.OPEN_READONLY);
	const sql = "SELECT DISTINCT [" + req.query.selectedColumn + "] AS name, " +
				"COUNT([" + req.query.selectedColumn + "]) AS countOf, " +
				"ROUND(AVG(age),1) AS avAge " +
				"FROM " + req.query.selectedTable + " " +
				"WHERE [" + req.query.selectedColumn + "] IS NOT NULL " +
				"GROUP BY [" + req.query.selectedColumn + "] " +
				"ORDER BY countOf DESC";

	database.serialize(function() {
		database.all(sql, (err, allData) => {
			if (err) {
				console.error(err.message);
				res.status(500);
				res.json({"error": err.message});
			} else {
				res.json(allData);
			}
		});
	});
	database.close();
});

// GET INDEX PAGE
app.get("/*", function(req, res) {
	res.sendFile(__dirname + "/public/index.html");
});

// LISTEN PORT
app.listen(port, function() {
	console.log("Our app is running on http://localhost:" + port);
});