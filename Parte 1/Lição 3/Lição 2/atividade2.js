const express = require('express');
const app = express();

app.get('/', (req, res) => {
  res.send('Boas vindas senhor guloso');
});


app.get('/sobre', (req, res) => {
    res.send('Bom, meu trabalho se baseia em um aplicativo que disponibiliza a criação de turmas, apelidadas de "quadros de avisos" ');
});


app.get('/equipe', (req, res) => {
    res.send('Meu time é bem diverso e bem "fortinho", consta com uma mente brilhante chamada Antony, juntamente do coração da equipe que une todos... o Antony, e óbvio, também tem o Antony!');
});

app.get('/contato', (req, res) => {
  res.send('Esse é o endpoint dos contatos e eu não sei oque colocar aqui, rs');
});


app.listen(3000, () => {
  console.log('Boas vindas! Server rodando na 3000 tá bb?');
});

