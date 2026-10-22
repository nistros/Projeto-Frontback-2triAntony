
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

const pastaFrontend = path.resolve(__dirname, '../frontendzada');

app.use(cors());
app.use(express.json({ limit: '1mb' }));

// Disponibiliza os arquivos do frontend
app.use(express.static(pastaFrontend));

// Rotas do sistema
app.use('/', require('./identificacao'));
app.use('/', require('./turmas'));

// Página inicial
app.get('/', (req, res) => {
    res.redirect('/homepage/home.html');
});

// Tratamento de erros
app.use((err, req, res, next) => {
    console.error('Erro no servidor:', err);

    if (res.headersSent) {
        return next(err);
    }

    res.status(500).json({
        sucesso: false,
        mensagem: 'Erro interno no servidor.'
    });
});

app.listen(PORT, () => {
    console.log('TCHURMAS iniciado!');
    console.log(`Site: http://localhost:${PORT}`);
    console.log(`Cadastro: http://localhost:${PORT}/Páginacadastro/cadastro.html`);
    console.log(`Login: http://localhost:${PORT}/Páginalogin/login.html`);
});
