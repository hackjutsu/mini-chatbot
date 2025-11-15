const express = require('express');
const cors = require('cors');
const apiRouter = require('./server/routes');
const { PORT, CLIENT_INDEX_PATH, hasClientBuild, staticRoots } = require('./server/config');

const app = express();

app.use(cors());
app.use(express.json({ limit: '1mb' }));
staticRoots.forEach((dir) => {
  app.use(express.static(dir));
});

app.use('/api', apiRouter);

app.get(/^\/(?!api).*/, (req, res) => {
  if (!hasClientBuild) {
    return res
      .status(503)
      .send(
        'Client build missing. Run `npm install` and `npm run build` inside the client/ directory before starting the server.'
      );
  }
  return res.sendFile(CLIENT_INDEX_PATH);
});

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
