require('dotenv').config()

const mySql = require('mysql')
const express = require('express')
const app = express();
const cors = require("cors");
const corsOptions = {
    origin:["http://localhost:5173"]
};

app.use(cors(corsOptions));


let isalive = 400;
const conPool = mySql.createPool({

  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
})



//checking if the database is alive
function checkDB(){
    conPool.query('SELECT 1',(err) => {
        if (err){
            isalive = 400;
        }else{
            isalive = 200;
        }
    })
}
setInterval(checkDB,20000);

app.get('/users', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT username_user_id FROM user_main_details');
    
    res.json({
      success: true,
      count: rows.length,
      data: rows
    });
  } catch (err) {
    console.error('DB ERROR:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});


app.get("/",(req,res)=>{
    res.json({"Api-Server": 200,
        "Database-Connection" : isalive
    });
})



app.listen(8080, () => {
    console.log("Server has started on port 8080");
});