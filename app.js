require('dotenv').config()
const express = require("express");
const app = express();
const sql = require('mysql2');

app.use(express.urlencoded({extended:true}));

const db = sql.createPool({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DB,
    port: process.env.MYSQL_PORT,
    ssl: {
        rejectUnauthorized: false, 
    }
});

db.query('SELECT 1', (err) => {
    if (err) {
      console.error('Database connection failed:', err);
    } else {
      console.log('MySQL Connected');
    }
});

const toRad = (deg)=>{
    return deg*Math.PI/180;
}

// Haversine formula to calculate distance
function getDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; 
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    let a = Math.pow(Math.sin(dLat / 2), 2) + Math.pow(Math.sin(dLon / 2), 2) * Math.cos(lat1) * Math.cos(lat2);
    let c = 2 * Math.asin(Math.sqrt(a));
    return R * c;
}

app.post('/addSchool', (req, res) => {
    const { name, address, latitude, longitude } = req.body;
  
    if (!name || !address || isNaN(latitude) || isNaN(longitude)) {
      return res.status(400).json({ error: 'Invalid input data' });
    }
  
    const sql = 'INSERT INTO schools (name, address, latitude, longitude) VALUES (?, ?, ?, ?)';
    db.query(sql, [name, address, latitude, longitude], (err, result) => {
      if (err) return res.status(500).json({ error: 'Error inserting data to db' });
      res.status(201).json({ message: 'School added successfully', schoolId: result.insertId });
    });
});
  
  // List Schools API
app.get('/listSchools', (req, res) => {
    const userLat = parseFloat(req.query.latitude);
    const userLon = parseFloat(req.query.longitude);
  
    if (isNaN(userLat) || isNaN(userLon)) {
      return res.status(400).json({ error: 'Invalid coordinates' });
    }
  
    db.query('SELECT * FROM schools', (err, results) => {
      if (err) return res.status(500).json({ error: err });
  
        const schoolsWithDistance = results.map((school) => {
            const distance = getDistance(userLat, userLon, school.latitude, school.longitude);
            return { ...school, distance };
        });
  
        const sortedSchools = schoolsWithDistance.sort((a, b) => a.distance - b.distance);
  
        res.json(sortedSchools);
    });
});  

app.listen(3000,()=>{
    console.log("app is listening at port 3000");
});