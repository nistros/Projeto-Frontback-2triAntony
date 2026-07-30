const API_URL = 'http://localhost:3000';

  // Função auxiliar para lidar com as requisições POST
  async function enviarDados(endpoint, dados, elementoResultado) {
    elementoResultado.className = 'mensagem'; // Reseta classes
    try {
      const resposta = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dados)
      });

      if (!resposta.ok) throw new Error();

      const retorno = await resposta.json();
      elementoResultado.textContent = retorno.mensagem;
      elementoResultado.classList.add('sucesso');
    } catch (erro) {
      elementoResultado.textContent = 'Erro ao conectar com o servidor.';
      elementoResultado.classList.add('erro');
    }
  }

  // 1. Envio de Aviso
  document.querySelector('#btn-aviso').addEventListener('click', async () => {
    const titulo = document.querySelector('#aviso-titulo').value;
    await enviarDados('/avisos', { titulo }, document.querySelector('#res-aviso'));
    listarAvisos(); // Atualiza a lista automaticamente ao adicionar um novo
  });

  // 2. Envio de Usuário
  document.querySelector('#btn-usuario').addEventListener('click', async () => {
    const nome = document.querySelector('#usuario-nome').value;
    const email = document.querySelector('#usuario-email').value;
    await enviarDados('/usuarios', { nome, email }, document.querySelector('#res-usuario'));
  });

  // 3. Envio de Tarefa
  document.querySelector('#btn-tarefa').addEventListener('click', async () => {
    const descricao = document.querySelector('#tarefa-descricao').value;
    await enviarDados('/tarefas', { descricao }, document.querySelector('#res-tarefa'));
  });

  // 4. Listagem de Avisos (GET) com Tratamento de Erro Dedicado
  async function listarAvisos() {
    const listaHtml = document.querySelector('#lista-avisos');
    const erroHtml = document.querySelector('#res-lista-erro');
    
    listaHtml.innerHTML = '';
    erroHtml.textContent = '';

    try {
      const resposta = await fetch(`${API_URL}/avisos`);
      if (!resposta.ok) throw new Error();

      const avisos = await resposta.json();

      if (avisos.length === 0) {
        listaHtml.innerHTML = '<li>Nenhum aviso cadastrado.</li>';
        return;
      }

      avisos.forEach(aviso => {
        const li = document.createElement('li');
        li.textContent = `[ID: ${aviso.id}] ${aviso.titulo}`;
        listaHtml.appendChild(li);
      });
    } catch (erro) {
      erroHtml.textContent = 'Erro ao carregar avisos: Servidor indisponível ou fora do ar.';
    }
  }

  // Escutador do botão de atualizar avisos e carregamento inicial
  document.querySelector('#btn-atualizar-avisos').addEventListener('click', listarAvisos);
  window.addEventListener('DOMContentLoaded', listarAvisos);