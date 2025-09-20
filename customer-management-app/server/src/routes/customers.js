    const express = require('express');
    const router = express.Router();

    // Create customer
    router.post('/', (req,res)=>{
      const db = req.db;
      const { first_name, last_name, phone_number, email } = req.body;
      if(!first_name || !last_name || !phone_number) return res.status(400).json({error:'missing fields'});
      const sql = `INSERT INTO customers (first_name,last_name,phone_number,email) VALUES (?,?,?,?)`;
      db.run(sql, [first_name,last_name,phone_number,email||null], function(err){
        if(err) return res.status(400).json({error: err.message});
        res.json({message:'Customer created', data:{id:this.lastID}});
      });
    });

    // Get all customers with search, pagination, sorting
    router.get('/', (req,res)=>{
      const db = req.db;
      const { page=1, limit=10, city, state, pin, q, sortBy='id', order='ASC' } = req.query;
      const offset = (page-1)*limit;
      let where = [];
      let params = [];
      if(city){ where.push('c.id IN (SELECT customer_id FROM addresses WHERE city LIKE ?)'); params.push('%'+city+'%'); }
      if(state){ where.push('c.id IN (SELECT customer_id FROM addresses WHERE state LIKE ?)'); params.push('%'+state+'%'); }
      if(pin){ where.push('c.id IN (SELECT customer_id FROM addresses WHERE pin_code LIKE ?)'); params.push('%'+pin+'%'); }
      if(q){ where.push('(c.first_name LIKE ? OR c.last_name LIKE ? OR c.phone_number LIKE ?)'); params.push('%'+q+'%','%'+q+'%','%'+q+'%'); }
      const whereSql = where.length ? 'WHERE '+where.join(' AND ') : '';
      const sql = `SELECT c.*,(SELECT COUNT(1) FROM addresses a WHERE a.customer_id=c.id) as address_count FROM customers c ${whereSql} ORDER BY ${sortBy} ${order} LIMIT ? OFFSET ?`;
      params.push(Number(limit), Number(offset));
      db.all(sql, params, (err, rows)=>{
        if(err) return res.status(400).json({error:err.message});
        res.json({message:'success', data:rows});
      });
    });

    // Get customer detail
    router.get('/:id', (req,res)=>{
      const db = req.db;
      const id = req.params.id;
      db.get('SELECT * FROM customers WHERE id=?', [id], (err,row)=>{
        if(err) return res.status(400).json({error:err.message});
        if(!row) return res.status(404).json({error:'not found'});
        db.all('SELECT * FROM addresses WHERE customer_id=?', [id], (err2,addrs)=>{
          if(err2) return res.status(400).json({error:err2.message});
          res.json({message:'success', data:{customer:row, addresses:addrs}});
        });
      });
    });

    // Update customer
    router.put('/:id', (req,res)=>{
      const db = req.db;
      const id = req.params.id;
      const { first_name, last_name, phone_number, email } = req.body;
      db.run('UPDATE customers SET first_name=?, last_name=?, phone_number=?, email=? WHERE id=?', [first_name,last_name,phone_number,email,id], function(err){
        if(err) return res.status(400).json({error:err.message});
        if(this.changes===0) return res.status(404).json({error:'not found'});
        res.json({message:'updated'});
      });
    });

    // Delete customer (with check for linked transactions - here we only check addresses)
    router.delete('/:id', (req,res)=>{
      const db = req.db;
      const id = req.params.id;
      // check addresses count
      db.get('SELECT COUNT(1) as cnt FROM addresses WHERE customer_id=?',[id], (err,row)=>{
        if(err) return res.status(400).json({error:err.message});
        // for assignment, allow deletion but return count for confirmation
        db.run('DELETE FROM customers WHERE id=?',[id], function(err2){
          if(err2) return res.status(400).json({error:err2.message});
          res.json({message:'deleted', addressesLinked: row.cnt});
        });
      });
    });

    module.exports = router;
