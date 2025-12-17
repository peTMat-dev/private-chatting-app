require('dotenv').config()

const mySql = require('mysql')
const express = require('express')
const app = express();
const cors = require("cors");
const corsOptions = {
    origin:["http://localhost:5173"]
};

app.use(cors(corsOptions));

const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
})

connection.connect()






app.get("/",(req,res)=>{
    res.json({"Api-Server": 200,
        "Database-Connection" : "unknown"
    });
})



app.listen(8080, () => {
    console.log("Server has started on port 8080");
});