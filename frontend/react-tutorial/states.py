import requests
import json
import sqlite3


'''
CREATE TABLE LinkStatus (name text, key text, time real, value real)
SELECT name FROM sqlite_master WHERE type = 'table'
'''
class NetworkStateService(object):

	def create(self, name):
		c = self.connection.cursor();
		c.execute("CREATE TABLE " + name + " (name text, key text, time real, value real, PRIMARY KEY(name, key, time))");

	def __init__(self, database):
		self.connection = sqlite3.connect(database);
		print "loading database"
		c = self.connection.cursor();
		rows = c.execute("SELECT name FROM sqlite_master WHERE type = 'table'");
		self.tables = [];
		for row in rows:
			print "loading table: " + row[0]
			self.tables.append(row[0])

	def save(self, name, key, time, value):
		c = self.connection.cursor();

		# Create table
		if name not in self.tables:
			self.create(name);

		# Insert a row of data
		#c.execute("INSERT INTO stocks VALUES ('2006-01-05','BUY','RHAT',100,35.14)")
		c.execute("INSERT OR REPLACE INTO " + name + " VALUES ('" + name + "','" + key + "','" + time + "','" + value + "')");

		print "save to database"
	
		# Save (commit) the changes
		self.connection.commit()

	def query(self, query):
		c = self.connection.cursor();
		print "executing query: " + query;
		rows = c.execute(query);
		for row in rows:
			print row;

	def clear(self):
		c = self.connection.cursor();
		c.execute("DROP TABLE LinkStatus");
		c.execute("DROP TABLE LinkUtilization");
		self.connection.commit()

nss = NetworkStateService("./example.db");
nss.save("LinkStatus", "10.0.0.1_10.0.0.2", "1456451402", "Up");
nss.save("LinkUtilization", "10.0.0.1_10.0.0.2", "1456451402", "0.04");
nss.query("SELECT * FROM LinkUtilization");
nss.query("SELECT * FROM LinkStatus");
#nss.clear();