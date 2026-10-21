const express = require('express');
const bcrypt = require('bcryptjs');
const fs = require('fs/promises');
const path = require('path');
const crypto = require('crypto');

const router = express.Router();
const arquivoUsuarios = path.join(__dirname, 'usuarios.json');

async function lerUsuarios() {
  try {
    const conteudo = await fs.readFile(arquivoUsuarios, 'utf8');
    const dados = JSON.parse(conteudo);
    if (!Array.isArray(dados)) throw new Error('usuarios.json precisa conter uma lista.');
    return dados;
  } catch (erro) {
    if (erro.code === 'ENOENT') {
      await fs.writeFile(arquivoUsuarios, '[]', 'utf8');
      return [];
    }
    throw erro;
  }
}

async function salvarUsuarios(usuarios) {
  await fs.writeFile(arquivoUsuarios, JSON.stringify(usuarios, null, 2), 'utf8');
}

function usuarioPublico(usuario) {
  return {
    id: String(usuario.id || usuario.email),
    nome: usuario.nome || '',
    email: usuario.email || ''
  };
}

// POST /cadastro
router.post('/cadastro', async (req, res) => {
  try {
    const nome = typeof req.body?.nome === 'string' ? req.body.nome.trim() : '';
    const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    const senha = typeof req.body?.senha === 'string' ? req.body.senha : '';

    if (!nome || !email || !senha) {
      return res.status(400).json({ sucesso: false, mensagem: 'Preencha todos os campos.' });
    }
 
const senhaForte =
    senha.length >= 8 &&
    /[a-z]/.test(senha) &&
    /[A-Z]/.test(senha) &&
    /[0-9]/.test(senha) &&
    /[^A-Za-z0-9]/.test(senha);

if (!senhaForte) {
    return res.status(400).json({
        sucesso: false,
        mensagem: 'A senha precisa ter pelo menos 8 caracteres, uma letra maiúscula, uma minúscula, um número e um símbolo.'
    });
}

    const usuarios = await lerUsuarios();
    if (usuarios.some(u => String(u.email || u.e_mail || '').toLowerCase() === email)) {
      return res.status(409).json({ sucesso: false, mensagem: 'Esse e-mail já está cadastrado.' });
    }

    const senhaHash = await bcrypt.hash(senha, 12);
    const usuario = { id: crypto.randomUUID(), nome, email, senha: senhaHash, criadoEm: new Date().toISOString() };
    usuarios.push(usuario);
    await salvarUsuarios(usuarios);

    return res.status(201).json({ sucesso: true, mensagem: 'Cadastro realizado!' });
  } catch (erro) {
    console.error('Erro no cadastro:', erro);
    return res.status(500).json({ sucesso: false, mensagem: 'Erro interno ao realizar cadastro.' });
  }
});

// POST /login
router.post('/login', async (req, res) => {
  try {
    const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    const senha = typeof req.body?.senha === 'string' ? req.body.senha : '';
    if (!email || !senha) {
      return res.status(400).json({ sucesso: false, mensagem: 'Preencha e-mail e senha.' });
    }

    const usuarios = await lerUsuarios();
    const indice = usuarios.findIndex(u => String(u.email || u.e_mail || '').toLowerCase() === email);
    if (indice < 0) return res.status(401).json({ sucesso: false, mensagem: 'E-mail ou senha incorretos.' });

    const usuario = usuarios[indice];
    const senhaSalva = String(usuario.senha || '');
    let senhaValida = false;
    if (/^\$2[aby]\$/.test(senhaSalva)) {
      senhaValida = await bcrypt.compare(senha, senhaSalva);
    } else {
      // Compatibilidade temporária com contas antigas que tinham senha em texto puro.
      senhaValida = senha === senhaSalva;
      if (senhaValida) {
        usuario.senha = await bcrypt.hash(senha, 12);
        usuarios[indice] = usuario;
        await salvarUsuarios(usuarios);
      }
    }

    if (!senhaValida) return res.status(401).json({ sucesso: false, mensagem: 'E-mail ou senha incorretos.' });
    return res.json({ sucesso: true, mensagem: 'Login realizado!', usuario: usuarioPublico(usuario) });
  } catch (erro) {
    console.error('Erro no login:', erro);
    return res.status(500).json({ sucesso: false, mensagem: 'Erro interno ao realizar login.' });
  }
});

// GET /api/usuarios — retorna somente dados públicos.
router.get('/api/usuarios', async (_req, res) => {
  try {
    const usuarios = await lerUsuarios();
    res.json(usuarios.map(usuarioPublico));
  } catch (erro) {
    console.error('Erro ao carregar usuários:', erro);
    res.status(500).json({ erro: 'Não foi possível carregar os usuários.' });
  }
});

module.exports = router;
