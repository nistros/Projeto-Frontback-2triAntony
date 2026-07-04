const express = require('express');
const app = express();

app.use(express.json());


let usuarios = [
  { id: 1, nome: 'João' },
  { id: 2, nome: 'Maria' }
];


app.get('/usuarios', (req, res) => {
  res.json(usuarios);
});


app.get('/usuarios/:id', (req, res) => {
  const id = Number(req.params.id);
  const usuario = usuarios.find(item => item.id === id);

  if (!usuario) {
    return res.status(404).json({ mensagem: 'Usuário não encontrado' });
  }

  res.json(usuario);
});


app.post('/usuarios', (req, res) => {
  const novoUsuario = {
    id: usuarios.length + 1,
    nome: req.body.nome
  };

  usuarios.push(novoUsuario);
  res.status(201).json(novoUsuario);
});


app.put('/usuarios/:id', (req, res) => {
  const id = Number(req.params.id);
  const usuario = usuarios.find(item => item.id === id);

  if (!usuario) {
    return res.status(404).json({ mensagem: 'Usuário não encontrado' });
  }

  usuario.nome = req.body.nome;
  res.json(usuario);
});


app.delete('/usuarios/:id', (req, res) => {
  const id = Number(req.params.id);

  usuarios = usuarios.filter(item => item.id !== id);

  res.json({ mensagem: 'Usuário removido' });
});



let tarefas = [
  { id: 1, titulo: 'Fazer atividade' },
  { id: 2, titulo: 'Estudar Matemática' }
];


app.get('/tarefas', (req, res) => {
  res.json(tarefas);
});


app.get('/tarefas/:id', (req, res) => {
  const id = Number(req.params.id);
  const tarefa = tarefas.find(item => item.id === id);

  if (!tarefa) {
    return res.status(404).json({ mensagem: 'Tarefa não encontrada' });
  }

  res.json(tarefa);
});

app.post('/tarefas', (req, res) => {
  const novaTarefa = {
    id: tarefas.length + 1,
    titulo: req.body.titulo
  };

  tarefas.push(novaTarefa);
  res.status(201).json(novaTarefa);
});


app.put('/tarefas/:id', (req, res) => {
  const id = Number(req.params.id);
  const tarefa = tarefas.find(item => item.id === id);

  if (!tarefa) {
    return res.status(404).json({ mensagem: 'Tarefa não encontrada' });
  }

  tarefa.titulo = req.body.titulo;
  res.json(tarefa);
});


app.delete('/tarefas/:id', (req, res) => {
  const id = Number(req.params.id);

  tarefas = tarefas.filter(item => item.id !== id);

  res.json({ mensagem: 'Tarefa removida' });
});

app.listen(3000, () => {
  console.log('Servidor rodando');
});