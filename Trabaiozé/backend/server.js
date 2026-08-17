const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 3000;

const arquivoUsuarios = path.join(__dirname, "usuarios.json");

app.use(express.json());
app.use(express.static("public"));

// Lê os usuários
function lerUsuarios() {
    if (!fs.existsSync(arquivoUsuarios)) {
        fs.writeFileSync(arquivoUsuarios, "[]");
    }

    const dados = fs.readFileSync(arquivoUsuarios, "utf8");

    return JSON.parse(dados);
}

// Salva os usuários
function salvarUsuarios(usuarios) {
    fs.writeFileSync(
        arquivoUsuarios,
        JSON.stringify(usuarios, null, 2)
    );
}

// CADASTRO
app.post("/cadastro", (req, res) => {

    const { nome, email, senha } = req.body;

    if (!nome || !email || !senha) {
        return res.json({
            sucesso: false,
            mensagem: "Preencha todos os campos."
        });
    }

    const usuarios = lerUsuarios();

    // Verifica se email já existe
    const existe = usuarios.find(
        usuario => usuario.email === email
    );

    if (existe) {
        return res.json({
            sucesso: false,
            mensagem: "Esse email já está cadastrado."
        });
    }

    // Adiciona usuário
    usuarios.push({
        nome,
        email,
        senha
    });

    salvarUsuarios(usuarios);

    res.json({
        sucesso: true,
        mensagem: "Cadastro realizado!"
    });
});


// LOGIN
app.post("/login", (req, res) => {

    const { email, senha } = req.body;

    const usuarios = lerUsuarios();

    const usuario = usuarios.find(
        usuario =>
            usuario.email === email &&
            usuario.senha === senha
    );

    if (!usuario) {
        return res.json({
            sucesso: false,
            mensagem: "Email ou senha incorretos."
        });
    }

    res.json({
        sucesso: true,
        mensagem: "Login realizado!",
        usuario: {
            nome: usuario.nome,
            email: usuario.email
        }
    });
});


app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});