const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 3000;

// Caminhos do projeto
const arquivoUsuarios = path.join(__dirname, "usuarios.json");
const caminhoFrontend = path.join(__dirname, "../frontendzada");

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.static(caminhoFrontend));

// Ler usuários
function lerUsuarios() {
    if (!fs.existsSync(arquivoUsuarios)) {
        fs.writeFileSync(arquivoUsuarios, "[]", "utf8");
    }

    return JSON.parse(
        fs.readFileSync(arquivoUsuarios, "utf8")
    );
}

// Salvar usuários
function salvarUsuarios(usuarios) {
    fs.writeFileSync(
        arquivoUsuarios,
        JSON.stringify(usuarios, null, 2),
        "utf8"
    );
}

// ROTA DE CADASTRO
app.post("/cadastro", (req, res) => {
    try {
        const { nome, email, senha } = req.body;

        if (!nome || !email || !senha) {
            return res.status(400).json({
                sucesso: false,
                mensagem: "Preencha todos os campos."
            });
        }

        const usuarios = lerUsuarios();

        const emailNormalizado = email.trim().toLowerCase();

        const existe = usuarios.find(
            usuario =>
                usuario.email.toLowerCase() === emailNormalizado
        );

        if (existe) {
            return res.status(409).json({
                sucesso: false,
                mensagem: "Esse e-mail já está cadastrado."
            });
        }

        usuarios.push({
            nome: nome.trim(),
            email: emailNormalizado,
            senha
        });

        salvarUsuarios(usuarios);

        return res.status(201).json({
            sucesso: true,
            mensagem: "Cadastro realizado!"
        });
    } catch (erro) {
        console.error("Erro no cadastro:", erro);

        return res.status(500).json({
            sucesso: false,
            mensagem: "Erro interno ao realizar cadastro."
        });
    }
});

// ROTA DE LOGIN
app.post("/login", (req, res) => {
    try {
        const { email, senha } = req.body;

        if (!email || !senha) {
            return res.status(400).json({
                sucesso: false,
                mensagem: "Preencha e-mail e senha."
            });
        }

        const usuarios = lerUsuarios();

        const emailNormalizado = email.trim().toLowerCase();

        const usuario = usuarios.find(
            usuario =>
                usuario.email.toLowerCase() === emailNormalizado &&
                usuario.senha === senha
        );

        if (!usuario) {
            return res.status(401).json({
                sucesso: false,
                mensagem: "E-mail ou senha incorretos."
            });
        }

        return res.json({
            sucesso: true,
            mensagem: "Login realizado!",
            usuario: {
                nome: usuario.nome,
                email: usuario.email
            }
        });
    } catch (erro) {
        console.error("Erro no login:", erro);

        return res.status(500).json({
            sucesso: false,
            mensagem: "Erro interno ao realizar login."
        });
    }
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});