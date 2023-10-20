require('dotenv').config();
const { Client } = require('pg');

const DBPASSWORD = process.env.DBPASSWORD;
const DBDATABASE =
  process.env.NODE_ENV === 'test' ? process.env.DBDATABASE_TEST : process.env.DBDATABASE;
const DBUSER = process.env.DBUSER;
const DBHOST = process.env.DBHOST;
const DBPORT = process.env.DBPORT;

const client = new Client({
  password: DBPASSWORD,
  database: DBDATABASE,
  host: DBHOST,
  user: DBUSER,
  port: DBPORT,
});

client.connect();

const query = (text, parameters) => {
  return client.query(text, parameters);
};

const closeClient = () => {
  client.end();
};

client.on('error', err => console.log(err));

module.exports = { query, closeClient };
