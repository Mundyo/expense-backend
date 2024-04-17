

const express = require('express');
const cors = require('cors');
const mysql = require('mysql');
const cookieParser = require('cookie-parser');


const app = express();

const PORT = process.env.PORT || 3001;


app.use(express.json());
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true 
}));


// app.use(cors({
//   origin: true, 
//   credentials: true,
//  }));
app.use(cookieParser());




const db = mysql.createConnection({


  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,

  // host: 'localhost',
  // user: 'root',
  // password:'Kasongi2014!',
  // database:'expense_tracking',
 
});

db.connect((err) => {
  if (err) {
    console.log("Couldn't connect to the database:", err);
  } else {
    console.log('Connected to MYSQL');
  }
});


app.post('/signup', (req, res) => {
  const { username, password } = req.body;


  console.log('Received data:', { username, password });

  const sql = 'INSERT INTO users (username, password) VALUES (?, ?)';

  db.query(sql, [username, password], (err, result) => {
    if (err) {
      console.error('Error executing SQL query:', err);
      res.status(500).json({ success: false, message: 'Internal server error' });
    } else {
      console.log('Account created successfully!');
      res.status(201).json({ success: true, message: 'Account created successfully.' });
    }
  });
});




app.post('/login', (req, res) => {
  const sql = 'SELECT * FROM expense_tracking.users WHERE username = ? AND password = ?';
  const { username, password } = req.body;

  console.log('Received login request:', { username, password });

  db.query(sql, [username, password], (err, result) => {
    if (err) {
      console.error('Error executing SQL query:', err);
      res.status(500).json({ success: false, message: 'Internal server error' });
    } else {
      if (result.length > 0) {
        const userId = result[0].user_id;

      
        res.cookie('user_id', userId, { httpOnly: true });

        console.log('Setting user_id cookie:', userId);

        const fetchExpensesSql = 'SELECT * FROM expense_tracking.items WHERE user_id = ?';

        db.query(fetchExpensesSql, [userId], (fetchError, expenses) => {
          if (fetchError) {
            console.error('Error fetching expense:', fetchError);
            res.status(500).json({ success: false, message: 'Error fetching expenses' });
          } else {
            console.log('Login successful');


            

            res.status(200).json({
              success: true,
              message: 'Login success.',
              user_id: userId,
              expenses: expenses,
            });
          }
        });
      } else {
        console.log('Login failed. Invalid username or password.');
        res.status(401).json({ success: false, message: 'Invalid username or password.' });
      }
    }
  });
});






app.post('/account', (req, res) => {
  const { title, amount, date, user_id} = req.body;
  

  console.log('Received data:', { title, amount, date, user_id });
  console.log('Received user_id from cookie:', user_id);

  const sql = 'INSERT INTO expense_tracking.items (item_name, price, date, user_id) VALUES (?, ?, STR_TO_DATE(?, "%Y-%m-%dT%H:%i:%s.000Z"), ?)';

  db.query(sql, [title, amount, date, user_id ], (err, result) => {
    if (err) {
      console.error('Error executing SQL query:', err);
      res.status(500).json({ success: false, message: 'Internal server error' });
    } else {
      console.log('Items created successfully!');
      res.status(201).json({ success: true, message: 'Items created successfully.' });
    }
  });
});




app.get('/account', (req, res) => {

  const user_id = req.query.user_id;
  const username = req.query.username;
 
  

  if (!user_id) {
    return res.status(401).json({ success: false, message: 'User not authenticated.' });
  }

  const fetchExpensesSql = `SELECT * FROM expense_tracking.items WHERE user_id = ?`;

  db.query(fetchExpensesSql, [user_id], (fetchError, expenses) => {
    if (fetchError) {
      console.error('Error fetching expenses:', fetchError);
      res.status(500).json({ success: false, message: 'Error fetching expenses' });
    } else {
      console.log('Fetched expenses successfully');

      res.status(200).json({
        success: true,
        message: 'Expenses fetched successfully.',
        user_id: user_id,
        expenses: expenses,
        username: username,
      });
      // console.log(username)
    }
  });
});

app.get('/', (req, res) => {
  res.send('Just chilling');
});

app.listen(PORT, () => {
console.log(` Server is running on https://localhost://${PORT}`);
});




