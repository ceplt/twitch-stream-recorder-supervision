const express = require("express");
const cors = require("cors");
const { router: supervisionRouter } = require("./src/routes/supervision")

const app = express();
const port = 3001;

app.use(cors());

app.use("/supervision", supervisionRouter);

app.listen(port, () => {
  console.log(`Serveur backend démarré sur le port ${port}`);
});
