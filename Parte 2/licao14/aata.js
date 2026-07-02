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

app.listen(3000, () => {
  console.log('Servidor rodando');
});