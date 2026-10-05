const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 3000;

const arquivoUsuarios = path.join(__dirname, "usuarios.json");

app.use(express.json());
app.use(express.static("public"));

function lerUsuarios() {
    if (!fs.existsSync(arquivoUsuarios)) {
        fs.writeFileSync(arquivoUsuarios, "[]");
    }

    return JSON.parse(
        fs.readFileSync(arquivoUsuarios, "utf8")
    );
}

function salvarUsuarios(usuarios) {
    fs.writeFileSync(
        arquivoUsuarios,
        JSON.stringify(usuarios, null, 2)
    );
}

app.post("/cadastro", (req, res) => {
    const { nome, email, senha } = req.body;

    if (!nome || !email || !senha) {
        return res.json({
            sucesso: false,
            mensagem: "Preencha todos os campos."
        });
    }

    const usuarios = lerUsuarios();

    const existe = usuarios.find(
        usuario => usuario.email === email
    );

    if (existe) {
        return res.json({
            sucesso: false,
            mensagem: "Esse email já está cadastrado."
        });
    }

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

app.post("/login", (req, res) => {
    const { email, senha } = req.body;

    if (!email || !senha) {
        return res.json({
            sucesso: false,
            mensagem: "Preencha email e senha."
        });
    }

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
