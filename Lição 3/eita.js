const express = require('express');
const app = express();

const usuarios = [
  'Roberto Carlos',
  'Roberto baggio',
  'Eita gulosinho'
];

app.get('/usuarios', (req, res) => {
  res.json(usuarios);
});

const tarefas = [
  'Lavar louça',
  'Limpar chão',
  'Comprar carne'
];

app.get('/tarefas', (req, res) => {
  res.json(tarefas);
});


const reservas = [
  'Chris mesa 4 às 20',
  'Charles mesa 9 às 23',
  'Carlos mesa 12 às 22'
];

app.get('/reservas', (req, res) => {
  res.json(reservas);
});

app.get('/status', (req, res) => {
  res.send('Sistema ativo');
});


app.get('/turmas', (req, res) => {
  res.send([
    'Turma 1',
    'Turma 2',
    'Turma 3'
  ]);
});




app.listen(3000, () => {
  console.log('Servidor rodando');
});