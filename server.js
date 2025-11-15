const { createApp } = require('./server/app');
const { PORT } = require('./server/config');

const app = createApp();

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
