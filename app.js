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

// PARAMETER NAMES
app.param("databaseName", function(req, res, next, databaseName) {
	req.databaseName = databaseName;
	next();
});

app.param("tableName", function(req, res, next, tableName) {
	req.tableName = tableName;
	next();
});

app.param("columnName", function(req, res, next, columnName) {
	req.columnName = columnName;
	next();
});

// GET ARRAY OF ALL AVAILABLE DATABASES
app.get("/databases", function(req, res) {

	var databases = [];
	fs.readdirSync(databaseDir).forEach(file => {
		databases.push(file);
	});
	const databasesJSON = {"databases": databases};
	res.json(databasesJSON);
});

// GET ARRAY OF ALL AVAILABLE TABLES FOR SELECTED DATABASE
app.get("/tables/:databaseName", function(req, res) {

	const databasePath = databaseDir + req.databaseName
	const database = new sqlite3.Database(databasePath, sqlite3.OPEN_READONLY);
	const sql = "SELECT name FROM sqlite_master WHERE type='table'";

	database.serialize(function() {
		database.all(sql, (err, allTables) => {
			if (err) {
				console.error(err.message);
			}
			var tables = [];
			allTables.forEach((table) => {
				tables.push(table.name);
			});
			const tablesJSON = {"tables": tables};
			res.json(tablesJSON);
		});
	});
	database.close();
});

// GET ARRAY OF ALL AVAILABLE COLUMNS FOR SELECTED DATABASE AND TABLE
app.get("/columns/:databaseName/:tableName", function(req, res) {

	const databasePath = databaseDir + req.databaseName
	const database = new sqlite3.Database(databasePath, sqlite3.OPEN_READONLY);
	const sql = "PRAGMA table_info(" + req.tableName + ")";

	database.serialize(function() {
		database.all(sql, (err, allColumns) => {
			if (err) {
				console.error(err.message);
			}
			var columns = [];
			allColumns.forEach((col) => {
				columns.push(col.name);
			});
			columns.sort();
			const columnsJSON = {"columns": columns};
			res.json(columnsJSON);
		});
	});
	database.close();
});

// GET DATA FOR SELECTED DATABASE, TABLE, AND COLUMN
app.get("/data/:databaseName/:tableName/:columnName", function(req, res) {

	const databasePath = databaseDir + req.databaseName
	const database = new sqlite3.Database(databasePath, sqlite3.OPEN_READONLY);
	const sql = "SELECT DISTINCT [" + req.columnName + "] AS name, " +
				"COUNT([" + req.columnName + "]) AS countOf, " +
				"ROUND(AVG(age),1) AS avAge " +
				"FROM " + req.tableName + " " +
				"WHERE [" + req.columnName + "] IS NOT NULL " +
				"GROUP BY [" + req.columnName + "] " +
				"ORDER BY countOf DESC";

	database.serialize(function() {
		database.all(sql, (err, allData) => {
			if (err) {
				console.error(err.message);
			}
			console.log(allData);
			res.json(allData);
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