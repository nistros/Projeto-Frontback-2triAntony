const express = require('express');
const app = express();

app.use(express.json());

app.post('/usuarios', (req, res) => {
  const novoUsuario = req.body;
  res.status(201).json({
    guloso: 'novo gulosinho',
    mensagem: 'Usuário recebido com sucesso',
    usuario: novoUsuario
  });
});


app.post('/avisos', (req, res) => {
  const novoAviso = req.body;

  res.status(201).json({
    mensagem: 'Aviso recebido com sucesso',
    aviso: novoAviso
  });
});


app.post('/tarefas', (req, res) => {
  const novaTarefa = req.body;

  res.status(201).json({
    mensagem: 'Tarefa recebida com sucesso',
    tarefa: novaTarefa
  });
});

app.post('/reservas', (req, res) => {
  const novaReserva = req.body;

  res.status(201).json({
    mensagem: 'Reserva recebida com sucesso',
    reserva: novaReserva
  });
});

app.listen(3000, () => {
  console.log('Servidor rodando na porta 3000');
});