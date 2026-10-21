const express = require('express');
const fs = require('fs/promises');
const path = require('path');
const crypto = require('crypto');

const router = express.Router();
const arquivoTurmas = path.join(__dirname, 'turmas.json');
const arquivoUsuarios = path.join(__dirname, 'usuarios.json');

async function lerLista(arquivo, nome) {
  try {
    const dados = JSON.parse(await fs.readFile(arquivo, 'utf8'));
    if (!Array.isArray(dados)) throw new Error(`${nome} precisa conter uma lista.`);
    return dados;
  } catch (erro) {
    if (erro.code === 'ENOENT') {
      await fs.writeFile(arquivo, '[]', 'utf8');
      return [];
    }
    throw erro;
  }
}

async function salvarTurmas(turmas) {
  await fs.writeFile(arquivoTurmas, JSON.stringify(turmas, null, 2), 'utf8');
}

function idUsuario(usuario, indice) {
  return String(usuario.id ?? usuario._id ?? usuario.email ?? usuario.e_mail ?? indice);
}
function nomeUsuario(usuario) {
  return String(usuario.nome ?? usuario.name ?? usuario.nomeCompleto ?? '');
}
function emailUsuario(usuario) {
  return String(usuario.email ?? usuario.e_mail ?? '').toLowerCase();
}
function gerarCodigo(turmas) {
  const caracteres = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let codigo;
  do {
    let sufixo = '';
    for (let i = 0; i < 4; i++) sufixo += caracteres[crypto.randomInt(caracteres.length)];
    codigo = `TUR-${sufixo}`;
  } while (turmas.some(t => t.codigo === codigo));
  return codigo;
}

// GET /api/turmas — lista as turmas.
router.get('/api/turmas', async (_req, res) => {
  try { res.json(await lerLista(arquivoTurmas, 'turmas.json')); }
  catch (erro) {
    console.error('Erro ao listar turmas:', erro);
    res.status(500).json({ erro: 'Erro ao carregar as turmas.' });
  }
});

// POST /api/turmas — cria uma turma e valida participantes existentes.
router.post('/api/turmas', async (req, res) => {
  try {
    const body = req.body || {};
    const nome = typeof body.nome === 'string' ? body.nome.trim() : '';
    const descricao = typeof body.descricao === 'string' ? body.descricao.trim() : '';
    const materia = typeof body.materia === 'string' ? body.materia.trim() : '';
    const professor = typeof body.professor === 'string' ? body.professor.trim() : '';
    const ano_escolar = typeof body.ano_escolar === 'string' ? body.ano_escolar.trim() : '';
    const pessoasRecebidas = body.pessoas ?? [];

    if (!nome) return res.status(400).json({ erro: 'Digite o nome da turma.' });
    if (!Array.isArray(pessoasRecebidas) || pessoasRecebidas.length === 0) {
      return res.status(400).json({ erro: 'Selecione pelo menos uma pessoa.' });
    }

    const [turmas, usuarios] = await Promise.all([
      lerLista(arquivoTurmas, 'turmas.json'),
      lerLista(arquivoUsuarios, 'usuarios.json')
    ]);

    const participantes = [];
    const idsAdicionados = new Set();
    for (const pessoa of pessoasRecebidas) {
      const idRecebido = pessoa && typeof pessoa === 'object' ? pessoa.id : pessoa;
      const indice = usuarios.findIndex((u, i) => idUsuario(u, i) === String(idRecebido));
      if (indice < 0) return res.status(400).json({ erro: 'Um dos usuários selecionados não foi encontrado.' });
      const usuario = usuarios[indice];
      const id = idUsuario(usuario, indice);
      if (idsAdicionados.has(id)) continue;
      idsAdicionados.add(id);
      participantes.push({ id, nome: nomeUsuario(usuario), email: emailUsuario(usuario) });
    }
    if (!participantes.length) return res.status(400).json({ erro: 'Selecione pelo menos uma pessoa válida.' });

    const criadorEmail = typeof body.criadorEmail === 'string' ? body.criadorEmail.trim().toLowerCase() : '';
    const criador = usuarios.find(u => emailUsuario(u) === criadorEmail);
    const turma = {
      id: crypto.randomUUID(), nome, descricao, materia, professor, ano_escolar,
      criadoPor: criador ? { nome: nomeUsuario(criador), email: emailUsuario(criador) } : null,
      pessoas: participantes,
      codigo: gerarCodigo(turmas), criadaEm: new Date().toISOString()
    };
    turmas.push(turma);
    await salvarTurmas(turmas);
    res.status(201).json(turma);
  } catch (erro) {
    console.error('Erro ao criar turma:', erro);
    res.status(500).json({ erro: 'Erro ao salvar a turma.' });
  }
});

// POST /api/turmas/entrar — adiciona o usuário à turma usando código e e-mail.
router.post('/api/turmas/entrar', async (req, res) => {
  try {
    const codigo = typeof req.body?.codigo === 'string' ? req.body.codigo.trim().toUpperCase() : '';
    const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    if (!codigo) return res.status(400).json({ erro: 'Digite o código da turma.' });
    if (!email) return res.status(400).json({ erro: 'Não foi possível identificar seu e-mail. Entre novamente na conta.' });

    const [turmas, usuarios] = await Promise.all([
      lerLista(arquivoTurmas, 'turmas.json'),
      lerLista(arquivoUsuarios, 'usuarios.json')
    ]);
    const turma = turmas.find(t => String(t.codigo || '').toUpperCase() === codigo);
    if (!turma) return res.status(404).json({ erro: 'Código de turma não encontrado.' });
    const usuario = usuarios.find(u => emailUsuario(u) === email);
    if (!usuario) return res.status(404).json({ erro: 'Usuário não encontrado. Faça login novamente.' });

    if (!Array.isArray(turma.pessoas)) turma.pessoas = [];
    const id = String(usuario.id ?? usuario._id ?? usuario.email ?? usuario.e_mail);
    const jaParticipa = turma.pessoas.some(p => String(p.id) === id || emailUsuario(p) === email);
    if (jaParticipa) return res.json({ mensagem: 'Você já faz parte dessa turma.', turma });

    turma.pessoas.push({ id, nome: nomeUsuario(usuario), email });
    await salvarTurmas(turmas);
    res.json({ mensagem: 'Você entrou na turma!', turma });
  } catch (erro) {
    console.error('Erro ao entrar na turma:', erro);
    res.status(500).json({ erro: 'Erro ao entrar na turma.' });
  }
});

// GET /api/turmas/:id — busca uma turma pelo ID.
router.get('/api/turmas/:id', async (req, res) => {
  try {
    const turmas = await lerLista(arquivoTurmas, 'turmas.json');
    const turma = turmas.find(t => t.id === req.params.id);
    if (!turma) return res.status(404).json({ erro: 'Turma não encontrada.' });
    res.json(turma);
  } catch (erro) {
    console.error('Erro ao buscar turma:', erro);
    res.status(500).json({ erro: 'Erro ao buscar a turma.' });
  }
});

// PUT /api/turmas/:id — edita os campos principais da turma.
router.put('/api/turmas/:id', async (req, res) => {
  try {
    const body = req.body || {};
    const nome = typeof body.nome === 'string' ? body.nome.trim() : '';
    if (!nome) return res.status(400).json({ erro: 'O nome da turma é obrigatório.' });
    const turmas = await lerLista(arquivoTurmas, 'turmas.json');
    const indice = turmas.findIndex(t => t.id === req.params.id);
    if (indice < 0) return res.status(404).json({ erro: 'Turma não encontrada.' });

    const campos = ['descricao', 'materia', 'professor', 'ano_escolar'];
    turmas[indice].nome = nome;
    for (const campo of campos) {
      if (body[campo] !== undefined) {
        if (typeof body[campo] !== 'string') return res.status(400).json({ erro: 'Os campos devem ser textos.' });
        turmas[indice][campo] = body[campo].trim();
      }
    }
    await salvarTurmas(turmas);
    res.json(turmas[indice]);
  } catch (erro) {
    console.error('Erro ao editar turma:', erro);
    res.status(500).json({ erro: 'Erro ao editar a turma.' });
  }
});

module.exports = router;
