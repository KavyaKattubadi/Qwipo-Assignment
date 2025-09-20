const express = require('express');
const cors = require('cors');
const initDb = require('./db');
const customersRouter = require('./routes/customers');
const addressesRouter = require('./routes/addresses');

const app = express();
app.use(cors());
app.use(express.json());

const db = initDb(); // returns sqlite3 Database instance

// attach db to request
app.use((req,res,next)=>{ req.db = db; next(); });

app.use('/api/customers', customersRouter);
app.use('/api/addresses', addressesRouter);

const PORT = process.env.PORT || 5000;
app.listen(PORT, ()=> console.log(`Server running on port ${PORT}`));
