
const express = require("express");
const fs = require("fs/promises");
const path = require("path");
const crypto = require("crypto");

const app = express();
const PORT = 3000;

// ==========================================
// CAMINHOS
// ==========================================

const pastaFrontend = path.resolve(
    __dirname,
    "../frontendzada/homepage"
);

const arquivoHTML = path.join(pastaFrontend, "home.html");
const arquivoTurmas = path.join(__dirname, "turmas.json");
const arquivoUsuarios = path.join(__dirname, "usuarios.json");

app.use(express.json({ limit: "1mb" }));
app.use(express.static(pastaFrontend));

// ==========================================
// PÁGINA INICIAL
// ==========================================

app.get("/", async (req, res) => {
    try {
        await fs.access(arquivoHTML);
        res.sendFile(arquivoHTML);
    } catch (error) {
        console.error("HTML não encontrado:", arquivoHTML);

        res.status(500).send(`
            <h1>Arquivo HTML não encontrado</h1>
            <p>O servidor procurou o arquivo em:</p>
            <code>${arquivoHTML}</code>
        `);
    }
});

// ==========================================
// LEITURA DOS ARQUIVOS JSON
// ==========================================

async function lerJson(arquivo, valorInicial = []) {
    try {
        const dados = await fs.readFile(arquivo, "utf8");
        return JSON.parse(dados);
    } catch (error) {
        if (error.code === "ENOENT") {
            await fs.writeFile(
                arquivo,
                JSON.stringify(valorInicial, null, 2),
                "utf8"
            );

            return valorInicial;
        }

        throw error;
    }
}

async function salvarJson(arquivo, dados) {
    await fs.writeFile(
        arquivo,
        JSON.stringify(dados, null, 2),
        "utf8"
    );
}

async function lerTurmas() {
    const dados = await lerJson(arquivoTurmas, []);

    if (Array.isArray(dados)) return dados;
    if (Array.isArray(dados.turmas)) return dados.turmas;

    throw new Error("O arquivo turmas.json tem formato inválido.");
}

async function lerUsuarios() {
    const dados = await lerJson(arquivoUsuarios, []);

    if (Array.isArray(dados)) return dados;
    if (Array.isArray(dados.usuarios)) return dados.usuarios;

    throw new Error("O arquivo usuarios.json tem formato inválido.");
}

// ==========================================
// NORMALIZAR USUÁRIOS
// ==========================================

function idUsuario(usuario, indice) {
    return String(
        usuario.id ??
        usuario._id ??
        usuario.email ??
        usuario.e_mail ??
        indice
    );
}

function nomeUsuario(usuario) {
    return String(
        usuario.nome ??
        usuario.name ??
        usuario.nomeCompleto ??
        ""
    );
}

function emailUsuario(usuario) {
    return String(
        usuario.email ??
        usuario.e_mail ??
        ""
    );
}

// ==========================================
// LISTAR USUÁRIOS DISPONÍVEIS
// ==========================================

app.get("/api/usuarios", async (req, res) => {
    try {
        const usuarios = await lerUsuarios();

        // Nunca enviar senhas ou hashes ao navegador.
        const usuariosPublicos = usuarios.map((usuario, indice) => ({
            id: idUsuario(usuario, indice),
            nome: nomeUsuario(usuario),
            email: emailUsuario(usuario)
        }));

        res.json(usuariosPublicos);
    } catch (error) {
        console.error("Erro ao carregar usuários:", error);

        res.status(500).json({
            erro: "Não foi possível carregar os usuários."
        });
    }
});

// ==========================================
// GERAR CÓDIGO ÚNICO DA TURMA
// ==========================================

function gerarCodigo(turmas) {
    const caracteres = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let codigo;

    do {
        let aleatorio = "";

        for (let i = 0; i < 4; i++) {
            aleatorio += caracteres[
                crypto.randomInt(caracteres.length)
            ];
        }

        codigo = `TUR-${aleatorio}`;
    } while (turmas.some(turma => turma.codigo === codigo));

    return codigo;
}

// ==========================================
// CRIAR TURMA
// ==========================================

app.post("/api/turmas", async (req, res) => {
    try {
        const {
            nome,
            descricao = "",
            materia = "",
            professor = "",
            ano_escolar = "",
            pessoas = []
        } = req.body || {};

        if (typeof nome !== "string" || !nome.trim()) {
            return res.status(400).json({
                erro: "Digite o nome da turma."
            });
        }

        const camposTexto = [
            descricao,
            materia,
            professor,
            ano_escolar
        ];

        if (camposTexto.some(campo => typeof campo !== "string")) {
            return res.status(400).json({
                erro: "Os campos devem ser textos."
            });
        }

        if (!Array.isArray(pessoas) || pessoas.length === 0) {
            return res.status(400).json({
                erro: "Selecione pelo menos uma pessoa."
            });
        }

        const [turmas, usuarios] = await Promise.all([
            lerTurmas(),
            lerUsuarios()
        ]);

        // Validar participantes com os cadastros existentes.
        const participantes = [];
        const idsAdicionados = new Set();

        for (const pessoaRecebida of pessoas) {
            const idRecebido =
                pessoaRecebida && typeof pessoaRecebida === "object"
                    ? pessoaRecebida.id
                    : pessoaRecebida;

            const indice = usuarios.findIndex((usuario, i) =>
                idUsuario(usuario, i) === String(idRecebido)
            );

            if (indice === -1) {
                return res.status(400).json({
                    erro: "Um dos usuários selecionados não foi encontrado."
                });
            }

            const usuario = usuarios[indice];
            const id = idUsuario(usuario, indice);

            // Não adicionar a mesma pessoa duas vezes.
            if (idsAdicionados.has(id)) continue;
            idsAdicionados.add(id);

            participantes.push({
                id,
                nome: nomeUsuario(usuario),
                email: emailUsuario(usuario)
            });
        }

        if (participantes.length === 0) {
            return res.status(400).json({
                erro: "Selecione pelo menos uma pessoa válida."
            });
        }

        const turma = {
            id: crypto.randomUUID(),
            nome: nome.trim(),
            descricao: descricao.trim(),
            materia: materia.trim(),
            professor: professor.trim(),
            ano_escolar: ano_escolar.trim(),
            pessoas: participantes,
            codigo: gerarCodigo(turmas),
            criadaEm: new Date().toISOString()
        };

        turmas.push(turma);
        await salvarJson(arquivoTurmas, turmas);

        res.status(201).json(turma);
    } catch (error) {
        console.error("Erro ao criar turma:", error);

        res.status(500).json({
            erro: "Erro ao salvar a turma."
        });
    }
});

// ==========================================
// LISTAR TURMAS
// ==========================================

app.get("/api/turmas", async (req, res) => {
    try {
        res.json(await lerTurmas());
    } catch (error) {
        console.error("Erro ao listar turmas:", error);

        res.status(500).json({
            erro: "Erro ao carregar as turmas."
        });
    }
});

// ==========================================
// BUSCAR UMA TURMA
// ==========================================

app.get("/api/turmas/:id", async (req, res) => {
    try {
        const turmas = await lerTurmas();

        const turma = turmas.find(
            item => item.id === req.params.id
        );

        if (!turma) {
            return res.status(404).json({
                erro: "Turma não encontrada."
            });
        }

        res.json(turma);
    } catch (error) {
        console.error(error);

        res.status(500).json({
            erro: "Erro ao buscar a turma."
        });
    }
});

// ==========================================
// EDITAR TURMA
// ==========================================

app.put("/api/turmas/:id", async (req, res) => {
    try {
        const {
            nome,
            descricao = "",
            materia = "",
            professor = "",
            ano_escolar = ""
        } = req.body || {};

        if (typeof nome !== "string" || !nome.trim()) {
            return res.status(400).json({
                erro: "O nome da turma é obrigatório."
            });
        }

        const camposTexto = [
            descricao,
            materia,
            professor,
            ano_escolar
        ];

        if (camposTexto.some(campo => typeof campo !== "string")) {
            return res.status(400).json({
                erro: "Os campos devem ser textos."
            });
        }

        const turmas = await lerTurmas();

        const indice = turmas.findIndex(
            turma => turma.id === req.params.id
        );

        if (indice === -1) {
            return res.status(404).json({
                erro: "Turma não encontrada."
            });
        }

        turmas[indice] = {
            ...turmas[indice],
            nome: nome.trim(),
            descricao: descricao.trim(),
            materia: materia.trim(),
            professor: professor.trim(),
            ano_escolar: ano_escolar.trim()
        };

        await salvarJson(arquivoTurmas, turmas);

        res.json(turmas[indice]);
    } catch (error) {
        console.error(error);

        res.status(500).json({
            erro: "Erro ao editar a turma."
        });
    }
});

// ==========================================
// INGRESSAR PELO CÓDIGO
// ==========================================

app.post("/api/turmas/entrar", async (req, res) => {
    try {
        const { codigo } = req.body || {};

        if (typeof codigo !== "string" || !codigo.trim()) {
            return res.status(400).json({
                erro: "Digite o código da turma."
            });
        }

        const turmas = await lerTurmas();

        const turma = turmas.find(
            item => item.codigo === codigo.trim().toUpperCase()
        );

        if (!turma) {
            return res.status(404).json({
                erro: "Código de turma não encontrado."
            });
        }

        res.json({
            mensagem: "Turma encontrada!",
            turma
        });
    } catch (error) {
        console.error(error);

        res.status(500).json({
            erro: "Erro ao verificar o código."
        });
    }
});
// ==========================================
// INICIAR SERVIDOR
// ==========================================

app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
    console.log(`HTML esperado em: ${arquivoHTML}`);
    console.log(`Usuários em: ${arquivoUsuarios}`);
    console.log(`Turmas em: ${arquivoTurmas}`);
});
