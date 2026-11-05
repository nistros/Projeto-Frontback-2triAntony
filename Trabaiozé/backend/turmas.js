
const express = require("express");
const fs = require("fs/promises");
const path = require("path");
const crypto = require("crypto");

const router = express.Router();

const arquivoTurmas = path.join(__dirname, "turmas.json");
const arquivoUsuarios = path.join(__dirname, "usuarios.json");

async function lerLista(arquivo, nome) {
    try {
        const dados = JSON.parse(await fs.readFile(arquivo, "utf8"));

        if (!Array.isArray(dados)) {
            throw new Error(`${nome} precisa conter uma lista.`);
        }

        return dados;
    } catch (erro) {
        if (erro.code === "ENOENT") {
            await fs.writeFile(arquivo, "[]", "utf8");
            return [];
        }

        throw erro;
    }
}

async function salvarTurmas(turmas) {
    await fs.writeFile(
        arquivoTurmas,
        JSON.stringify(turmas, null, 2),
        "utf8"
    );
}

function emailDe(usuario) {
    return String(usuario?.email ?? usuario?.e_mail ?? "")
        .trim()
        .toLowerCase();
}

function nomeDe(usuario) {
    return String(
        usuario?.nome ??
        usuario?.name ??
        usuario?.nomeCompleto ??
        "Usuário"
    );
}

function idDe(usuario, indice) {
    return String(
        usuario?.id ??
        usuario?._id ??
        emailDe(usuario) ??
        indice
    );
}

async function usuarioPorEmail(email) {
    const usuarios = await lerLista(arquivoUsuarios, "usuarios.json");

    return usuarios.find(
        usuario => emailDe(usuario) === String(email || "").trim().toLowerCase()
    ) || null;
}

function participa(turma, email) {
    const alvo = String(email || "").trim().toLowerCase();

    return Array.isArray(turma.pessoas) &&
        turma.pessoas.some(pessoa => emailDe(pessoa) === alvo);
}

function codigoUnico(turmas) {
    const caracteres = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

    let codigo;

    do {
        let sufixo = "";

        for (let i = 0; i < 4; i++) {
            sufixo += caracteres[crypto.randomInt(caracteres.length)];
        }

        codigo = `TUR-${sufixo}`;

    } while (turmas.some(turma => turma.codigo === codigo));

    return codigo;
}

function localizarTurma(turmas, id) {
    return turmas.findIndex(
        turma => String(turma.id) === String(id)
    );
}

// ==========================================
// LISTAR TURMAS
// ==========================================

router.get("/api/turmas", async (req, res) => {
    try {
        res.json(await lerLista(arquivoTurmas, "turmas.json"));
    } catch (erro) {
        console.error(erro);
        res.status(500).json({ erro: "Erro ao carregar as turmas." });
    }
});

// ==========================================
// CRIAR TURMA
// ==========================================

router.post("/api/turmas", async (req, res) => {
    try {
        const body = req.body || {};

        const nome = String(body.nome || "").trim();
        const descricao = String(body.descricao || "").trim();
        const professor = String(body.professor || "").trim();

        if (!nome || !descricao || !professor) {
            return res.status(400).json({
                erro: "Preencha nome, descrição e criador."
            });
        }

        if (!Array.isArray(body.pessoas) || !body.pessoas.length) {
            return res.status(400).json({
                erro: "Selecione pelo menos uma pessoa."
            });
        }

        const [turmas, usuarios] = await Promise.all([
            lerLista(arquivoTurmas, "turmas.json"),
            lerLista(arquivoUsuarios, "usuarios.json")
        ]);

        const pessoas = [];
        const ids = new Set();

        for (const recebida of body.pessoas) {
            const idRecebido = String(
                typeof recebida === "object" ? recebida.id : recebida
            );

            const indice = usuarios.findIndex(
                (usuario, i) => idDe(usuario, i) === idRecebido
            );

            if (indice < 0) {
                return res.status(400).json({
                    erro: "Um dos usuários selecionados não foi encontrado."
                });
            }

            const usuario = usuarios[indice];
            const id = idDe(usuario, indice);

            if (!ids.has(id)) {
                ids.add(id);

                pessoas.push({
                    id,
                    nome: nomeDe(usuario),
                    email: emailDe(usuario)
                });
            }
        }

        const criadorEmail = String(body.criadorEmail || "")
            .trim()
            .toLowerCase();

        const criador = usuarios.find(
            usuario => emailDe(usuario) === criadorEmail
        );

        const turma = {
            id: crypto.randomUUID(),
            nome,
            descricao,
            professor,

            materia: String(body.materia || ""),
            ano_escolar: String(body.ano_escolar || ""),

            criadoPor: criador ? {
                nome: nomeDe(criador),
                email: emailDe(criador)
            } : null,

            pessoas,
            codigo: codigoUnico(turmas),
            criadaEm: new Date().toISOString(),

            avisos: []
        };

        turmas.push(turma);

        await salvarTurmas(turmas);

        res.status(201).json(turma);

    } catch (erro) {
        console.error(erro);

        res.status(500).json({
            erro: "Erro ao salvar a turma."
        });
    }
});

// ==========================================
// ENTRAR EM TURMA
// ==========================================

router.post("/api/turmas/entrar", async (req, res) => {
    try {
        const codigo = String(req.body?.codigo || "")
            .trim()
            .toUpperCase();

        const email = String(req.body?.email || "")
            .trim()
            .toLowerCase();

        if (!codigo || !email) {
            return res.status(400).json({
                erro: "Informe o código e entre na sua conta."
            });
        }

        const [turmas, usuario, usuarios] = await Promise.all([
            lerLista(arquivoTurmas, "turmas.json"),
            usuarioPorEmail(email),
            lerLista(arquivoUsuarios, "usuarios.json")
        ]);

        const turma = turmas.find(
            t => String(t.codigo || "").toUpperCase() === codigo
        );

        if (!turma) {
            return res.status(404).json({
                erro: "Código de turma não encontrado."
            });
        }

        if (!usuario) {
            return res.status(404).json({
                erro: "Usuário não encontrado."
            });
        }

        if (!Array.isArray(turma.pessoas)) {
            turma.pessoas = [];
        }

        if (participa(turma, email)) {
            return res.json({
                mensagem: "Você já faz parte dessa turma.",
                turma
            });
        }

        const indice = usuarios.findIndex(
            u => emailDe(u) === email
        );

        turma.pessoas.push({
            id: idDe(usuario, indice),
            nome: nomeDe(usuario),
            email
        });

        await salvarTurmas(turmas);

        res.json({
            mensagem: "Você entrou na turma!",
            turma
        });

    } catch (erro) {
        console.error(erro);

        res.status(500).json({
            erro: "Erro ao entrar na turma."
        });
    }
});

// ==========================================
// BUSCAR TURMA
// ==========================================

router.get("/api/turmas/:id", async (req, res) => {
    try {
        const turmas = await lerLista(arquivoTurmas, "turmas.json");

        const turma = turmas.find(
            t => String(t.id) === String(req.params.id)
        );

        if (!turma) {
            return res.status(404).json({
                erro: "Turma não encontrada."
            });
        }

        if (!Array.isArray(turma.avisos)) {
            turma.avisos = [];
        }

        res.json(turma);

    } catch (erro) {
        console.error(erro);

        res.status(500).json({
            erro: "Erro ao buscar a turma."
        });
    }
});

// ==========================================
// CRIAR AVISO
// ==========================================

router.post("/api/turmas/:id/avisos", async (req, res) => {
    try {
        const { titulo, conteudo, autorEmail } = req.body || {};

        if (!String(titulo || "").trim() ||
            !String(conteudo || "").trim()) {

            return res.status(400).json({
                erro: "Preencha título e conteúdo."
            });
        }

        const [turmas, usuario] = await Promise.all([
            lerLista(arquivoTurmas, "turmas.json"),
            usuarioPorEmail(autorEmail)
        ]);

        const indice = localizarTurma(turmas, req.params.id);

        if (indice < 0) {
            return res.status(404).json({
                erro: "Turma não encontrada."
            });
        }

        const turma = turmas[indice];

        if (!usuario || !participa(turma, autorEmail)) {
            return res.status(403).json({
                erro: "Somente integrantes podem publicar avisos."
            });
        }

        if (!Array.isArray(turma.avisos)) {
            turma.avisos = [];
        }

        const aviso = {
            id: crypto.randomUUID(),

            titulo: String(titulo).trim().slice(0, 120),
            conteudo: String(conteudo).trim().slice(0, 10000),

            autor: {
                nome: nomeDe(usuario),
                email: emailDe(usuario)
            },

            criadoEm: new Date().toISOString(),
            editadoEm: null,

            comentarios: [],
            visualizacoes: []
        };

        turma.avisos.unshift(aviso);

        await salvarTurmas(turmas);

        res.status(201).json(aviso);

    } catch (erro) {
        console.error(erro);

        res.status(500).json({
            erro: "Não foi possível publicar o aviso."
        });
    }
});

// ==========================================
// EDITAR AVISO
// ==========================================

router.put("/api/turmas/:id/avisos/:avisoId", async (req, res) => {
    try {
        const { titulo, conteudo, autorEmail } = req.body || {};

        const [turmas, usuario] = await Promise.all([
            lerLista(arquivoTurmas, "turmas.json"),
            usuarioPorEmail(autorEmail)
        ]);

        const indice = localizarTurma(turmas, req.params.id);

        if (indice < 0) {
            return res.status(404).json({
                erro: "Turma não encontrada."
            });
        }

        const turma = turmas[indice];

        const aviso = (turma.avisos || []).find(
            a => String(a.id) === String(req.params.avisoId)
        );

        if (!aviso) {
            return res.status(404).json({
                erro: "Aviso não encontrado."
            });
        }

        if (!usuario ||
            emailDe(aviso.autor) !== emailDe(usuario)) {

            return res.status(403).json({
                erro: "Somente quem criou o aviso pode editá-lo."
            });
        }

        if (!String(titulo || "").trim() ||
            !String(conteudo || "").trim()) {

            return res.status(400).json({
                erro: "Título e conteúdo são obrigatórios."
            });
        }

        aviso.titulo = String(titulo).trim().slice(0, 120);
        aviso.conteudo = String(conteudo).trim().slice(0, 10000);
        aviso.editadoEm = new Date().toISOString();

        await salvarTurmas(turmas);

        res.json(aviso);

    } catch (erro) {
        console.error(erro);

        res.status(500).json({
            erro: "Não foi possível editar o aviso."
        });
    }
});

// ==========================================
// COMENTAR AVISO
// ==========================================

router.post(
    "/api/turmas/:id/avisos/:avisoId/comentarios",
    async (req, res) => {
        try {
            const { texto, autorEmail } = req.body || {};

            if (!String(texto || "").trim()) {
                return res.status(400).json({
                    erro: "Digite um comentário."
                });
            }

            const [turmas, usuario] = await Promise.all([
                lerLista(arquivoTurmas, "turmas.json"),
                usuarioPorEmail(autorEmail)
            ]);

            const indice = localizarTurma(turmas, req.params.id);

            if (indice < 0) {
                return res.status(404).json({
                    erro: "Turma não encontrada."
                });
            }

            const turma = turmas[indice];

            const aviso = (turma.avisos || []).find(
                a => String(a.id) === String(req.params.avisoId)
            );

            if (!aviso) {
                return res.status(404).json({
                    erro: "Aviso não encontrado."
                });
            }

            if (!usuario || !participa(turma, autorEmail)) {
                return res.status(403).json({
                    erro: "Somente integrantes podem comentar."
                });
            }

            if (!Array.isArray(aviso.comentarios)) {
                aviso.comentarios = [];
            }

            const comentario = {
                id: crypto.randomUUID(),
                texto: String(texto).trim().slice(0, 2000),

                autor: {
                    nome: nomeDe(usuario),
                    email: emailDe(usuario)
                },

                criadoEm: new Date().toISOString()
            };

            aviso.comentarios.push(comentario);

            await salvarTurmas(turmas);

            res.status(201).json(comentario);

        } catch (erro) {
            console.error(erro);

            res.status(500).json({
                erro: "Não foi possível enviar o comentário."
            });
        }
    }
);

// ==========================================
// MARCAR AVISO COMO VISTO
// ==========================================

router.post(
    "/api/turmas/:id/avisos/:avisoId/visto",
    async (req, res) => {
        try {
            const email = String(req.body?.email || "")
                .trim()
                .toLowerCase();

            const [turmas, usuario] = await Promise.all([
                lerLista(arquivoTurmas, "turmas.json"),
                usuarioPorEmail(email)
            ]);

            const indice = localizarTurma(turmas, req.params.id);

            if (indice < 0) {
                return res.status(404).json({
                    erro: "Turma não encontrada."
                });
            }

            const turma = turmas[indice];

            const aviso = (turma.avisos || []).find(
                a => String(a.id) === String(req.params.avisoId)
            );

            if (!aviso) {
                return res.status(404).json({
                    erro: "Aviso não encontrado."
                });
            }

            if (!usuario || !participa(turma, email)) {
                return res.status(403).json({
                    erro: "Somente integrantes podem marcar como visto."
                });
            }

            if (!Array.isArray(aviso.visualizacoes)) {
                aviso.visualizacoes = [];
            }

            const jaViu = aviso.visualizacoes.some(
                v => String(v.email).toLowerCase() === email
            );

            if (!jaViu) {
                aviso.visualizacoes.push({
                    email,
                    nome: nomeDe(usuario),
                    vistoEm: new Date().toISOString()
                });
            }

            await salvarTurmas(turmas);

            res.json({
                sucesso: true,
                visualizacoes: aviso.visualizacoes
            });

        } catch (erro) {
            console.error(erro);

            res.status(500).json({
                erro: "Não foi possível marcar como visto."
            });
        }
    }
);

module.exports = router;
