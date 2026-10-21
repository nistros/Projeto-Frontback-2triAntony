const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const pastaFrontend = path.resolve(__dirname, '../frontendzada');

app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(express.static(pastaFrontend));

// Cada arquivo cuida de uma área do sistema.
app.use('/', require('./identificacao'));
app.use('/', require('./turmas'));

app.get('/', (_req, res) => {
  res.sendFile(path.join(pastaFrontend, 'homepage', 'home.html'));
});

app.listen(PORT, () => {
  console.log(`Tchurmas rodando em http://localhost:${PORT}`);
  console.log(`Frontend servido de: ${pastaFrontend}`);
});
