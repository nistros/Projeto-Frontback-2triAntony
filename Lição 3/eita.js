const express = require('express');
const app = express();

const avisos = [
  'Reunião de responsáveis',
  'Prova de Matemática',
  'Entrega de trabalhos'
];

app.get('/avisos', (req, res) => {
  res.json(avisos);
});

app.listen(3000, () => {
  console.log('Servidor rodando');
});