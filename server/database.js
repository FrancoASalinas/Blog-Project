require('dotenv').config();
const { Client } = require('pg');

const DBPASSWORD = process.env.DBPASSWORD;
const DBDATABASE =
  process.env.NODE_ENV === 'test'
    ? process.env.DBDATABASE_TEST
    : process.env.DBDATABASE;
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

const query = async (text, parameters) => {
  let res;
  try {
    res = client.query(text, parameters);
  } catch (err) {
    console.error('query error', err);
  }
  return res
};

const closeClient = () => {
  client.end();
};

client.on('error', err => {
  console.log(err, err.stack);
});

module.exports = { query, closeClient };
