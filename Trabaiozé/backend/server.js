const express = require("express");
const fs = require("fs/promises");
const path = require("path");
const crypto = require("crypto");

const app = express();
const PORT = 3000;

// Caminhos absolutos baseados na localização deste server.js
const pastaFrontend = path.resolve(
    __dirname,
    "../frontendzada/mendingpage"
);

const arquivoHTML = path.join(pastaFrontend, "mendingpage.html");
const arquivoTurmas = path.join(__dirname, "turmas.json");

app.use(express.json());

// Página inicial: abre o HTML diretamente em /
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
            <p>Confira o nome do arquivo e as pastas do projeto.</p>
        `);
    }
});

// Disponibiliza CSS, JS e demais arquivos do front-end
app.use(express.static(pastaFrontend));


// ==========================================
// LER E SALVAR JSON
// ==========================================

async function lerTurmas() {
    try {
        const dados = await fs.readFile(arquivoTurmas, "utf8");
        return JSON.parse(dados);
    } catch (error) {
        if (error.code === "ENOENT") {
            await fs.writeFile(arquivoTurmas, "[]", "utf8");
            return [];
        }

        throw error;
    }
}

async function salvarTurmas(turmas) {
    await fs.writeFile(
        arquivoTurmas,
        JSON.stringify(turmas, null, 2),
        "utf8"
    );
}


// ==========================================
// GERAR CÓDIGO ÚNICO
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
    } while (turmas.some(t => t.codigo === codigo));

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
            ano_escolar = ""
        } = req.body || {};

        if (typeof nome !== "string" || !nome.trim()) {
            return res.status(400).json({
                erro: "Digite o nome da turma."
            });
        }

        const campos = [
            descricao,
            materia,
            professor,
            ano_escolar
        ];

        if (campos.some(c => typeof c !== "string")) {
            return res.status(400).json({
                erro: "Os campos devem ser textos."
            });
        }

        const turmas = await lerTurmas();

        const turma = {
            id: crypto.randomUUID(),
            nome: nome.trim(),
            descricao: descricao.trim(),
            materia: materia.trim(),
            professor: professor.trim(),
            ano_escolar: ano_escolar.trim(),
            codigo: gerarCodigo(turmas),
            criadaEm: new Date().toISOString()
        };

        turmas.push(turma);

        await salvarTurmas(turmas);

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
        console.error(error);

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
            t => t.id === req.params.id
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

        const campos = [
            descricao,
            materia,
            professor,
            ano_escolar
        ];

        if (campos.some(c => typeof c !== "string")) {
            return res.status(400).json({
                erro: "Os campos devem ser textos."
            });
        }

        const turmas = await lerTurmas();

        const indice = turmas.findIndex(
            t => t.id === req.params.id
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

        await salvarTurmas(turmas);

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
            t => t.codigo === codigo.trim().toUpperCase()
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
});