import requests
import json
import sqlite3

class NetworkStateService(object):

	Link = "Link";
	LinkUtilization = "LinkUtilization";
	Router = "Router";

	def create(self, name):
		c = self.connection.cursor();
		c.execute("CREATE TABLE " + name + " (name text, key text, time real, value text, PRIMARY KEY(name, key, time))");

	def __init__(self, database):
		self.connection = sqlite3.connect(database);
		print "loading database"
		c = self.connection.cursor();
		rows = c.execute("SELECT name FROM sqlite_master WHERE type = 'table'");
		self.tables = [];
		for row in rows:
			print "loading table: " + row[0]
			self.tables.append(row[0])

	def close(self):
		self.connection.close()

	def save(self, name, key, time, value):
		c = self.connection.cursor();

		# Create table
		if name not in self.tables:
			self.create(name);
			time = time[:-1] + "0";
			c.execute("INSERT OR REPLACE INTO " + name + " VALUES ('" + name + "','" + key + "','" + time + "','" + value + "')");
		else :
			c.execute("SELECT time, value FROM " + name + " WHERE key = '" + key + "' AND time = (SELECT max(time) FROM " + name + ")");
			row = c.fetchone();
			if row is None:
				c.execute("INSERT OR REPLACE INTO " + name + " VALUES ('" + name + "','" + key + "','" + time + "','" + value + "')");
			else :
				if row[0] + 10 <= int(time):
					sec = row[0] + 10;
					while sec <= int(time):
						if sec - row[0] < int(time) - sec:
							c.execute("INSERT OR REPLACE INTO " + name + " VALUES ('" + name + "','" + key + "','" + str(sec) + "','" + str(row[1]) + "')");
						else:
							c.execute("INSERT OR REPLACE INTO " + name + " VALUES ('" + name + "','" + key + "','" + str(sec) + "','" + value + "')");
						sec += 10;

		print "save to database"
	
		# Save (commit) the changes
		self.connection.commit()

	def query(self, query):
		c = self.connection.cursor();
		print "executing query: " + query;
		try:
			jsons = [];
			rows = c.execute(query);
			for row in rows:
				json = {}
				json['name'] = row[0];
				json['key'] = row[1];
				json['time'] = row[2];
				json['value'] = row[3];
				jsons.append(json);
			return jsons;
		except Exception, e:
			return [];

	def clear(self):
		c = self.connection.cursor();
		rows = c.execute("SELECT name FROM sqlite_master WHERE type = 'table'");
		for row in rows:
			c.execute("DROP TABLE " + row[0]);
		self.connection.commit()

'''
nss = NetworkStateService("database/example.db");
nss.save("LinkStatus", "10.0.0.1_10.0.0.2", "1456451402", "Up");
nss.save("LinkUtilization", "10.0.0.1_10.0.0.2", "1456451402", "0.04");
nss.query("SELECT * FROM LinkUtilization");
nss.save("LinkUtilization", "10.0.0.1_10.0.0.2", "1456451409", "0.04");
nss.query("SELECT * FROM LinkUtilization");
nss.save("LinkUtilization", "10.0.0.1_10.0.0.2", "1456451412", "0.04");
nss.query("SELECT * FROM LinkUtilization");
nss.save("LinkUtilization", "10.0.0.1_10.0.0.2", "1456451452", "0.04");
nss.query("SELECT * FROM LinkUtilization");
nss.query("SELECT * FROM LinkStatus");
'''
#nss.clear();