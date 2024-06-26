


const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const Pool = require('pg').Pool;
require('dotenv').config();


const app = express();

const PORT = process.env.PORT || 3001;

const DATABASE_URL = 'postgres://uepniscm6paksb:p398e9fea0e3d0ee861113f59b9042719144e1a10ea28b94027cbfc238696913f@ceqbglof0h8enj.cluster-czrs8kj4isg7.us-east-1.rds.amazonaws.com:5432/d5is9tsvl1ibp9';

const client = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized:false
  }
  // host:'localhost',
  // user:'postgres',
  // database:'postgres',
  // password:'kasongi',
  // port:5432,
})

client.connect((err)=>{
  if(err) {
    console.error('error connecting to PostgreSQL:', err);
  } else {
    console.log('connected to PostgreSQL');
  }
});



app.use(express.json());
app.use(cors({
  origin: 'https://expense-frontend-8e88af1feda2.herokuapp.com',

  // origin: 'http://localhost:3000',
 
  credentials: true 
}));

app.use(cookieParser());

app.post('/signup', (req, res) => {
  const { username, password } = req.body;


  console.log('Received data:', { username, password });

  const sql = 'INSERT INTO users (username, password) VALUES ($1, $2)';
  const values = [username, password];



  client.query(sql, values, (err, result) => {
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
  const sql = 'SELECT * FROM users WHERE username = $1 AND password = $2';
  const { username, password } = req.body;

  console.log('Received login request:', { username, password });

  client.query(sql, [username, password], (err, result) => {
    if (err) {
      console.error('Error executing SQL query:', err);
      res.status(500).json({ success: false, message: 'Internal server error' });
    } else {
      if (result.rows.length > 0) {
        const userId = result.rows[0].id;

      
        res.cookie('user_id', userId, { httpOnly: true });

        console.log('Setting user_id cookie:', userId);

        const fetchExpensesSql = 'SELECT * FROM items WHERE user_id =$1';

        client.query(fetchExpensesSql, [userId], (fetchError, expenses) => {
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

  const sql = 'INSERT INTO items (item_name, price, date, user_id) VALUES ($1, $2, $3, $4)';

  client.query(sql, [title, amount, date, user_id ], (err, result) => {
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
  // const username = req.query.username;
 
  


  if (!user_id) {
    return res.status(401).json({ success: false, message: 'User not authenticated.' });
  }

  const fetchExpensesSql = `SELECT * FROM items WHERE user_id = $1`;

  client.query(fetchExpensesSql, [user_id], (fetchError, expenses) => {
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
        // username: username,
      });
     
    }
  });
});

app.delete('/account/:id', (req, res) => {
  const expenseId = req.params.id;
  
  const sql = 'DELETE FROM items WHERE id = $1';
  client.query(sql, [expenseId], (err, result) => {
    if (err) {
      console.error('Error executing SQL query:', err);
      res.status(500).json({ success: false, message: 'Internal server error' });
    } else {
      console.log('Expense deleted successfully!');
      res.status(200).json({ success: true, message: 'Expense deleted successfully.' });
    }
  });
});

app.get('/', (req, res) => {
  res.send('Just chilling');
});

app.listen(PORT, () => {
console.log(` Server is running on https://localhost://${PORT}`);
});


process.on('exit', () =>{
  client.end();
});
