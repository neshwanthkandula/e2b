const express = require("express")
const bodyParser = require("body-parser")

const sandboxRoutes = require("./routes/sandboxes");
const app = express();
app.use(bodyParser.json());

app.use("/api/sandboxes", sandboxRoutes);

const PORT = 4000;
app.listen(PORT, ()=>{
    console.log("orchestartor is running on port 4000");
})