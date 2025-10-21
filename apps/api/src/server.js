require('dotenv').config();
const { connect } = require('./db');
const app = require('./app');

const port = process.env.PORT || 8080;
connect()
  .then(() => {
    app.listen(port, () => console.log(`API listening on :${port}`));
  })
  .catch((err) => {
    console.error('Failed to start server:', err);
    process.exit(1);
  });

