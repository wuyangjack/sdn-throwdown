import requests
import json
import sqlite3

class NetworkStateService(object):

	Link = "Link";
	LinkUtilization = "LinkUtilization"
	LinkStatus = "LinkStatus"
	LinkLspCount = "LinkLspCount"
	Router = "Router"
	Lsp = "Lsp"
	LspRoute = "LspRoute"
	LspLatency = "LspLatency"
	LspStatus = "LspStatus"
	Interface = "Interface"
	InterfaceInBps = "InterfaceInBps"
	InterfaceOutBps = "InterfaceOutBps"

	def snapshot(self, name):
		return name + "_"

	def create(self, name):
		print "create table: " + name
		c = self.connection.cursor();
		c.execute("CREATE TABLE " + name + " (name text, key text, time real, value text, PRIMARY KEY(name, key, time))");
		c.execute("CREATE TABLE " + self.snapshot(name) + " (name text, key text, time real, value text, PRIMARY KEY(name, key))");
		self.connection.commit()
		self.tables.append(name)

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
		name = str(name);
		key = str(key);
		time = int(time);
		time -= time % 10;
		time = str(time);
		value = str(value);
		c = self.connection.cursor();

		# Create table
		if name not in self.tables:
			self.create(name);
			time = time[:-1] + "0";
			for table in [name, self.snapshot(name)]:
				c.execute("INSERT OR REPLACE INTO " + table + " VALUES ('" + name + "','" + key + "','" + time + "','" + value + "')");
		else :
			for table in [name, self.snapshot(name)]:
				c.execute("SELECT time, value FROM " + table + " WHERE key = '" + key + "' AND time = (SELECT max(time) FROM " + name + ")");
			row = c.fetchone();
			if row is None:
				for table in [name, self.snapshot(name)]:
					c.execute("INSERT OR REPLACE INTO " + table + " VALUES ('" + name + "','" + key + "','" + time + "','" + value + "')");
			else :
				if row[0] + 10 <= int(time):
					sec = row[0] + 10;
					while sec <= int(time):
						if sec - row[0] < int(time) - sec:
							for table in [name, self.snapshot(name)]:
								c.execute("INSERT OR REPLACE INTO " + table + " VALUES ('" + name + "','" + key + "','" + str(sec) + "','" + str(row[1]) + "')");
						else:
							for table in [name, self.snapshot(name)]:
								c.execute("INSERT OR REPLACE INTO " + table + " VALUES ('" + name + "','" + key + "','" + str(sec) + "','" + value + "')");
						sec += 10;

		print "commit to database: %s, %s, %s, %s" % (name, key, time, value)
	
		# Save (commit) the changes
		self.connection.commit()

	def query(self, query):
		c = self.connection.cursor();
		print "executing query: " + query;
		if (query == "..."):
			return [];
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
			print "returning: " + str(jsons)
			return jsons;
		except Exception, e:
			raise e
			return [];

	def clear(self):
		c = self.connection.cursor();
		rows = c.execute("SELECT name FROM sqlite_master WHERE type = 'table'");
		for row in rows:
			print "deleting table: " + row[0];
			c.execute("DROP TABLE " + row[0]);
		self.connection.commit()

'''
nss = NetworkStateService("database/test.db");
nss.save("LinkStatus", "10.0.0.1_10.0.0.2", "1456451402", "Up");
print nss.query("SELECT * FROM LinkStatus");
nss.save("LinkUtilization", "10.0.0.1_10.0.0.2", "1456451402", "0.04");
print nss.query("SELECT * FROM LinkUtilization");
nss.save("LinkUtilization", "10.0.0.1_10.0.0.2", "1456451409", "0.04");
print nss.query("SELECT * FROM LinkUtilization");
nss.save("LinkUtilization", "10.0.0.1_10.0.0.2", "1456451412", "0.04");
print nss.query("SELECT * FROM LinkUtilization");
nss.save("LinkUtilization", "10.0.0.1_10.0.0.2", "1456451452", "0.04");
print nss.query("SELECT * FROM LinkUtilization");
'''
#nss.clear();