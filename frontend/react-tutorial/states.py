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
		c.execute("CREATE TABLE " + name + " (name text, key text, time real, value real)");

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
		# if name in self.table:
		# 	c.execute("INSERT INTO " + name + " VALUES ('2006-01-05','BUY','RHAT',100,35.14)")
		# else:

		print "save to database"

		# Create table

		# Insert a row of data
		#c.execute("INSERT INTO stocks VALUES ('2006-01-05','BUY','RHAT',100,35.14)")

		# Save (commit) the changes
		#conn.commit()

	def query(self, query):
		print "execute query"

nss = NetworkStateService("./example.db");
nss.save("LinkStatus", "10.0.0.1_10.0.0.2", "1456451402", "Up");
#nss.save("LinkUtilization", "10.0.0.1_10.0.0.2", "1456451402", "0.04");
#nss.query("SELECT * FROM LinkUtilization");
#nss.query("SELECT * FROM LinkStatus");
