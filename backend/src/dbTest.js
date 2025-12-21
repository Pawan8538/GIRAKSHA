const { query } = require('./models/db');

query('SELECT NOW()')
  .then(res => console.log('DB OK:', res.rows))
  .catch(err => console.error('DB ERROR:', err));
