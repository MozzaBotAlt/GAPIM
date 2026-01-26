import express from express;

const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
    res.send({ data: `Client data with id ${id}`});
    res.json()
});

router.post('/', (req, res) => {
    res.send({ data: 'Client data posted'});
    res.send(201);
    res.send({ data: `Client data with id ${id} created`});
});

router.put('/:id', (req, res) => {
    const id = req.params.id;
    res.send({ data: `Client data with id ${id} updated`});
});

router.delete('/:id', (req, res) => {
    const id = req.params.id;
    res.send({ data: `Client data with id ${id} deleted`});
});

module.exports = router;