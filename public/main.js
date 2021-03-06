const mainApp = angular.module("mainApp", []);

mainApp.controller("mainCtrl", ["$scope", "$window", "$http",
	function($scope, $window, $http) {

		// Selected values
		var selectedDatabase = "";
		var selectedTable = "";

		// Reset methods
		function resetDatabase() {
			$scope.isDatabaseSelected = false;
			$scope.selectedDatabase = "Database";
			selectedDatabase = "";
		}
		function resetTable() {
			$scope.isTableSelected = false;
			$scope.selectedTable = "Table";
			selectedTable = "";
		}
		function resetColumn() {
			$scope.isColumnSelected = false;
			$scope.selectedColumn = "Variable";
		}
		function resetOverflow() {
			$scope.shouldShowOverflow = false;
			$scope.valuesNotShown = "";
			$scope.linesNotShown = "";
		}
		function resetAll() {
			$scope.shouldShowSpinner = false;
			resetDatabase();
			resetTable();
			resetColumn();
			resetOverflow();
		}

		// Set defaults
		resetAll();

		// GET request for all available databases
		$http.get( "/databases")
			.then(function(response) {
				const databases = response.data.databases;
				$scope.databases = databases;
			}, function() {
				console.log("ERROR FETCHING DATABASES");
			});
			
		// USER DID SELECT DATABASE
		$scope.didSelectDatabase = function(database) {

			// Show loading spinner
			$scope.shouldShowSpinner = true;
			const params = {"selectedDatabase": database};

			// GET request for all tables
			$http.get( "/tables", {params: params})
				.then(function(response) {

					// Hide loading spinner
					$scope.shouldShowSpinner = false;

					// Enable select table button
					// And add available tables to drop down menu
					$scope.isDatabaseSelected = true;
					$scope.tables = response.data.tables;
					$scope.selectedDatabase = database;
					selectedDatabase = database;

					// Reset selected table and columns
					resetTable();
					resetColumn();
					resetOverflow();
					
				}, function() {
					console.log("ERROR FETCHING TABLES");

					// RESET
					resetAll();
				});
		};

		// USER DID SELECT TABLE
		$scope.didSelectTable = function(table) {

			// Show loading spinner
			$scope.shouldShowSpinner = true;
			const params = {"selectedDatabase": selectedDatabase,
				"selectedTable": table};

			// GET request for all columns
			$http.get( "/columns", {params: params})
				.then(function(response) {

					// Hide loading spinner
					$scope.shouldShowSpinner = false;

					// Enable select column button
					// And add available columns to drop down menu
					$scope.isTableSelected = true;
					$scope.columns = response.data.columns;
					$scope.selectedTable = table;
					selectedTable = table;
					
					// Reset previously selected columns
					resetColumn();
					resetOverflow();
					
				}, function() {
					console.log("ERROR FETCHING COLUMNS");

					// RESET
					resetAll();
				});
		};

		// USER DID SELECT COLUMN
		$scope.didSelectColumn = function(column) {

			// Show loading spinner
			$scope.shouldShowSpinner = true;
			const params = {"selectedDatabase": selectedDatabase,
				"selectedTable": selectedTable,
				"selectedColumn": column};

			// GET request for data
			$http.get( "/data", {params: params})
				.then(function(response) {

					// Hide loading spinner
					$scope.shouldShowSpinner = false;

					// Show table of data
					$scope.isColumnSelected = true;
					$scope.columnName = capitalizeFirstLetter(column);
					var numValuesNotShown = 0;
					var numLinesNotShown = 0;
					const numEntries = response.data.length;

					// Only show top 100 values sorted by count
					if (numEntries > 100) {
						for (var i = 100; i < numEntries; i++) {
							numLinesNotShown += response.data[i].countOf;
						}
						numValuesNotShown = numEntries - 100;
						$scope.variables = response.data.slice(0,100);
						$scope.shouldShowOverflow = true;
						$scope.valuesNotShown = "Distinct values not shown: " + numValuesNotShown;
						$scope.linesNotShown = "Total values not shown: " + numLinesNotShown;
					} else {
						$scope.variables = response.data;
						resetOverflow();
					}
					$scope.selectedColumn = column;
				}, function() {
					console.log("ERROR FETCHING DATA");

					// RESET
					resetAll();
				});
		};
	}
]);

function capitalizeFirstLetter(string) {
	return string.charAt(0).toUpperCase() + string.slice(1);
}