const { Client } = require('pg');

const client = new Client();

client.connect();

const query = (text, parameters) => {
  return client.query(text, parameters);
};

const closeClient = () => {
  client.end();
}

client.on('error', (err) => console.log(err))

module.exports = {query, closeClient};
