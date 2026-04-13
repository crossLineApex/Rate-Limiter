const express = require("express");
const apiRoutes = require("./routes/apiRoutes.js");
const app = express();

const PORT = process.env.PORT || 4040;

app.use(express.json());
app.use("/api", apiRoutes);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

