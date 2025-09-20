    const express = require('express');
    const router = express.Router();

    // Add address to customer
    router.post('/customers/:id/addresses', (req,res)=>{
      const db = req.db;
      const customerId = req.params.id;
      const { address_details, city, state, pin_code } = req.body;
      if(!address_details || !city || !state || !pin_code) return res.status(400).json({error:'missing fields'});
      const sql = 'INSERT INTO addresses (customer_id,address_details,city,state,pin_code) VALUES (?,?,?,?,?)';
      db.run(sql, [customerId,address_details,city,state,pin_code], function(err){
        if(err) return res.status(400).json({error:err.message});
        res.json({message:'address added', data:{id:this.lastID}});
      });
    });

    // GET addresses for customer
    router.get('/customers/:id/addresses', (req,res)=>{
      const db = req.db;
      const id = req.params.id;
      db.all('SELECT * FROM addresses WHERE customer_id=?', [id], (err, rows)=>{
        if(err) return res.status(400).json({error:err.message});
        res.json({message:'success', data:rows});
      });
    });

    // Update address by addressId
    router.put('/:addressId', (req,res)=>{
      const db = req.db;
      const id = req.params.addressId;
      const { address_details, city, state, pin_code } = req.body;
      db.run('UPDATE addresses SET address_details=?, city=?, state=?, pin_code=? WHERE id=?', [address_details,city,state,pin_code,id], function(err){
        if(err) return res.status(400).json({error:err.message});
        if(this.changes===0) return res.status(404).json({error:'not found'});
        res.json({message:'updated'});
      });
    });

    // Delete address
    router.delete('/:addressId', (req,res)=>{
      const db = req.db;
      const id = req.params.addressId;
      db.run('DELETE FROM addresses WHERE id=?', [id], function(err){
        if(err) return res.status(400).json({error:err.message});
        res.json({message:'deleted'});
      });
    });

    module.exports = router;
