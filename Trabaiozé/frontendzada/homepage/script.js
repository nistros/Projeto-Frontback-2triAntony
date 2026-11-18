
// ==========================================
// CONFIGURAÇÕES
// ==========================================

// Funciona pelo Express e pelo Live Server (Go Live).
const API = `http://${location.hostname}:3000/api`;

const $ = id => document.getElementById(id);

const usuarioLogado = (() => {
    try {
        return JSON.parse(
            sessionStorage.getItem("usuario") ||
            localStorage.getItem("usuario") ||
            "null"
        );
    } catch {
        return null;
    }
})();

let usuarios = [];
let turmas = [];
let turmaAtual = null;
let avisoEditando = null;
let toastTimer = null;

const modal = $("modal-turma");
const formulario = $("form-turma");
const listaUsuarios = $("lista-usuarios");
const buscaPessoas = $("busca-pessoas");
const mensagemErro = $("mensagem-erro");
const botaoSalvar = $("salvar-turma");

// ==========================================
// REQUISIÇÕES
// ==========================================

async function requisicao(url, opcoes = {}) {
    const resposta = await fetch(`${API}${url}`, {
        ...opcoes,
        headers: {
            "Content-Type": "application/json",
            ...opcoes.headers
        }
    });

    const dados = await resposta.json().catch(() => ({}));

    if (!resposta.ok) {
        throw new Error(
            dados.erro ||
            dados.mensagem ||
            "Não foi possível concluir a solicitação."
        );
    }

    return dados;
}

function emailLogado() {
    return String(usuarioLogado?.email || "").trim().toLowerCase();
}

function nomeLogado() {
    return usuarioLogado?.nome || "Usuário";
}

function iniciais(texto) {
    return String(texto || "T")
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map(p => p[0] || "")
        .join("")
        .toUpperCase() || "T";
}

function nomeCriador(turma) {
    if (turma.criadoPor && typeof turma.criadoPor === "object") {
        return turma.criadoPor.nome || turma.professor || "Não informado";
    }

    return turma.professor ||
        turma.criador ||
        turma.criadoPor ||
        "Não informado";
}

function escapar(texto) {
    return String(texto ?? "").replace(/[&<>"']/g, caractere => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
    })[caractere]);
}

function formatarData(data) {
    if (!data) return "";

    const dataObj = new Date(data);

    if (Number.isNaN(dataObj.getTime())) return "";

    return dataObj.toLocaleString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    });
}

function mostrarToast(texto) {
    const toast = $("toast");

    toast.textContent = texto;
    toast.hidden = false;

    clearTimeout(toastTimer);

    toastTimer = setTimeout(() => {
        toast.hidden = true;
    }, 3200);
}

// ==========================================
// PRESERVAR POSIÇÃO DA PÁGINA
// ==========================================

function preservarRolagem(acao) {
    const posicao = window.scrollY;

    acao();

    requestAnimationFrame(() => {
        window.scrollTo(0, posicao);
    });
}

// ==========================================
// CARREGAR DADOS
// ==========================================


async function carregarDados() {
    try {
        const [dadosTurmas, dadosUsuarios] = await Promise.all([
            requisicao("/turmas"),
            requisicao("/usuarios")
        ]);

        turmas = Array.isArray(dadosTurmas)
            ? dadosTurmas
            : dadosTurmas.turmas || [];

        usuarios = Array.isArray(dadosUsuarios)
            ? dadosUsuarios
            : dadosUsuarios.usuarios || [];

        usuarios = usuarios.map((u, i) => ({
            ...u,
            id: String(u.id ?? u._id ?? u.email ?? i),
            nome: u.nome ?? u.name ?? u.nomeCompleto ?? "",
            email: u.email ?? u.e_mail ?? ""
        }));

        turmas = turmas.map((t, i) => ({
            ...t,
            id: String(t.id ?? t._id ?? `turma-${i}`),
            nome: t.nome ?? t.name ?? "Turma sem nome",
            pessoas: Array.isArray(t.pessoas) ? t.pessoas : [],
            avisos: Array.isArray(t.avisos) ? t.avisos : []
        }));

        renderizarPagina();

        // Recupera a turma que estava aberta antes do recarregamento.
        const prefixo = "#turma-";

        if (location.hash.startsWith(prefixo)) {
            try {
                const idTurma = decodeURIComponent(
                    location.hash.slice(prefixo.length)
                );

                const turma = turmas.find(
                    t => String(t.id) === idTurma
                );

                if (turma) {
                    abrirTurma(turma);
                } else {
                    voltarInicio();
                }
            } catch (erro) {
                console.error("Erro ao recuperar turma:", erro);
                voltarInicio();
            }
        }

    } catch (erro) {
        console.error("Erro ao carregar dados:", erro);

        mostrarToast(
            "Não foi possível carregar os dados. Confira o servidor."
        );

        $("estado-vazio").hidden = false;
    }
}


// ==========================================
// MODAL DE CRIAÇÃO DE TURMA
// ==========================================

function abrirModal() {
    mensagemErro.textContent = "";
    modal.hidden = false;

    renderizarUsuarios();

    setTimeout(() => $("nome-turma").focus(), 0);
}

function fecharModal() {
    modal.hidden = true;
    mensagemErro.textContent = "";
}

function renderizarUsuarios() {
    const termo = buscaPessoas.value.trim().toLowerCase();

    const selecionados = new Set(
        [...formulario.querySelectorAll(
            'input[name="pessoas"]:checked'
        )].map(input => input.value)
    );

    listaUsuarios.replaceChildren();

    const filtrados = usuarios.filter(usuario =>
        String(usuario.nome).toLowerCase().includes(termo) ||
        String(usuario.email).toLowerCase().includes(termo)
    );

    if (!filtrados.length) {
        const aviso = document.createElement("p");
        aviso.className = "field-help";
        aviso.textContent = "Nenhuma pessoa encontrada.";
        listaUsuarios.append(aviso);
        return;
    }

    filtrados.forEach(usuario => {
        const label = document.createElement("label");
        label.className = "user-option";

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.name = "pessoas";
        checkbox.value = String(usuario.id);
        checkbox.checked = selecionados.has(String(usuario.id));

        const avatar = document.createElement("span");
        avatar.className = "person-avatar small-avatar";
        avatar.textContent = iniciais(usuario.nome);

        const info = document.createElement("span");
        info.className = "user-option-info";

        const nome = document.createElement("strong");
        nome.textContent = usuario.nome || "Usuário";

        const email = document.createElement("small");
        email.textContent = usuario.email || "";

        info.append(nome, email);
        label.append(checkbox, avatar, info);

        listaUsuarios.append(label);
    });
}

formulario.addEventListener("submit", async event => {
    event.preventDefault();

    mensagemErro.textContent = "";

    const nome = $("nome-turma").value.trim();
    const descricao = $("descricao-turma").value.trim();
    const professor = $("criador-turma").value.trim();

    const ids = [
        ...formulario.querySelectorAll('input[name="pessoas"]:checked')
    ].map(input => input.value);

    const pessoas = usuarios.filter(
        usuario => ids.includes(String(usuario.id))
    );

    if (!nome || !descricao || !professor) {
        mensagemErro.textContent = "Preencha todos os campos.";
        return;
    }

    if (!pessoas.length) {
        mensagemErro.textContent = "Selecione pelo menos uma pessoa.";
        return;
    }

    botaoSalvar.disabled = true;
    botaoSalvar.textContent = "Criando turma...";

    try {
        const novaTurma = await requisicao("/turmas", {
            method: "POST",
            body: JSON.stringify({
                nome,
                descricao,
                professor,
                criadorEmail: emailLogado(),
                pessoas: pessoas.map(u => ({
                    id: u.id
                }))
            })
        });

        turmas.unshift(novaTurma);

        formulario.reset();
        buscaPessoas.value = "";

        fecharModal();
        renderizarPagina();
        voltarInicio();

        mostrarToast("Turma criada com sucesso!");

    } catch (erro) {
        mensagemErro.textContent = erro.message;
    } finally {
        botaoSalvar.disabled = false;
        botaoSalvar.textContent = "Criar turma";
    }
});

// ==========================================
// RENDERIZAR TURMAS
// ==========================================

function criarCartaoTurma(turma) {
    const card = document.createElement("article");
    card.className = "class-card";

    const banner = document.createElement("button");
    banner.type = "button";
    banner.className = "class-card-banner";

    const cor = (String(turma.nome).charCodeAt(0) * 17) % 360;
    banner.style.setProperty("--card-hue", cor);

    const titulo = document.createElement("span");
    titulo.textContent = turma.nome;

    const descricao = document.createElement("span");
    descricao.textContent = turma.descricao || "Espaço de aprendizado";

    banner.append( descricao);
    banner.addEventListener("click", () => abrirTurma(turma));

    const body = document.createElement("div");
    body.className = "class-card-body";

    const criador = document.createElement("p");
    criador.className = "class-creator";
    criador.textContent = `Criada por ${nomeCriador(turma)}`;

    const footer = document.createElement("div");
    footer.className = "class-card-footer";

    const quantidade = document.createElement("span");
    quantidade.className = "class-count";

    const total = turma.pessoas.length;

    quantidade.textContent =
        `${total} ${total === 1 ? "participante" : "participantes"}`;

    const abrir = document.createElement("button");
    abrir.type = "button";
    abrir.className = "text-button";
    abrir.textContent = "Abrir turma →";
    abrir.addEventListener("click", () => abrirTurma(turma));

    footer.append(quantidade, abrir);
    body.append(criador, footer);

    card.append(banner, body);

    return card;
}

function renderizarPagina() {
    const lista = $("lista-turmas");
    const sidebar = $("sidebar-turmas");

    lista.replaceChildren();
    sidebar.replaceChildren();

    $("estado-vazio").hidden = turmas.length > 0;
    $("sidebar-vazio").hidden = turmas.length > 0;

    turmas.forEach(turma => {
        lista.append(criarCartaoTurma(turma));

        const botao = document.createElement("button");
        botao.type = "button";
        botao.className = "sidebar-class";
        botao.dataset.id = turma.id;

        const avatar = document.createElement("span");
        avatar.className = "sidebar-class-avatar";
        avatar.textContent = iniciais(turma.nome);

        const detalhes = document.createElement("span");
        detalhes.className = "sidebar-class-details";

        const nome = document.createElement("strong");
        nome.textContent = turma.nome;

        const criador = document.createElement("small");
        criador.textContent = nomeCriador(turma);

        detalhes.append(nome, criador);
        botao.append(avatar, detalhes);

        botao.addEventListener("click", () => abrirTurma(turma));

        sidebar.append(botao);
    });

    if (turmaAtual) {
        const atualizada = turmas.find(
            t => String(t.id) === String(turmaAtual.id)
        );

        if (atualizada) {
            abrirTurma(atualizada);
        } else {
            voltarInicio();
        }
    }
}

// ==========================================
// ABRIR TURMA
// ==========================================

function abrirTurma(turma) {
    const mesmaTurma = turmaAtual &&
        String(turmaAtual.id) === String(turma.id);

    const abaAnterior = $("aba-informacoes").classList.contains("active")
        ? "informacoes"
        : "avisos";

    turmaAtual = turma;

    $("pagina-inicio").hidden = true;
    $("pagina-turma").hidden = false;

    $("nav-inicio").classList.remove("active");

    document.querySelectorAll(".sidebar-class").forEach(botao => {
        botao.classList.toggle(
            "active",
            botao.dataset.id === String(turma.id)
        );
    });

    $("detalhe-nome").textContent = turma.nome;
    $("detalhe-descricao").textContent =
        turma.descricao || "Nenhuma descrição adicionada.";

    $("detalhe-iniciais").textContent = iniciais(turma.nome);

    renderizarInformacoes();
    renderizarAvisos();

    selecionarAba(mesmaTurma ? abaAnterior : "avisos");

    history.replaceState(
        null,
        "",
        `#turma-${encodeURIComponent(turma.id)}`
    );

    $("main-content").focus({ preventScroll: true });

    if (window.innerWidth <= 760) {
        $("sidebar").classList.remove("sidebar-open");
    }
}

function voltarInicio() {
    turmaAtual = null;

    $("pagina-turma").hidden = true;
    $("pagina-inicio").hidden = false;

    $("nav-inicio").classList.add("active");

    document.querySelectorAll(".sidebar-class").forEach(el => {
        el.classList.remove("active");
    });

    history.replaceState(null, "", "#inicio");
}

// ==========================================
// ABAS
// ==========================================

function selecionarAba(aba) {
    const avisosAtivos = aba === "avisos";

    $("aba-avisos").classList.toggle("active", avisosAtivos);
    $("aba-informacoes").classList.toggle("active", !avisosAtivos);

    $("conteudo-avisos").hidden = !avisosAtivos;
    $("conteudo-informacoes").hidden = avisosAtivos;
}

$("aba-avisos").addEventListener("click", () => {
    selecionarAba("avisos");
});

$("aba-informacoes").addEventListener("click", () => {
    selecionarAba("informacoes");
});

// ==========================================
// INFORMAÇÕES DA TURMA
// ==========================================

function renderizarInformacoes() {
    if (!turmaAtual) return;

    const pessoas = turmaAtual.pessoas || [];

    $("detalhe-criador").textContent = nomeCriador(turmaAtual);

    $("detalhe-quantidade").textContent =
        `${pessoas.length} ${pessoas.length === 1 ? "pessoa" : "pessoas"}`;

    $("detalhe-codigo").textContent = turmaAtual.codigo || "—";

    $("detalhe-materia").textContent =
        turmaAtual.materia || "Não informada";

    $("detalhe-ano").textContent =
        turmaAtual.ano_escolar || "Não informado";

    const container = $("detalhe-pessoas");
    container.replaceChildren();

    pessoas.forEach(pessoa => {
        const card = document.createElement("article");
        card.className = "person-card";

        const avatar = document.createElement("span");
        avatar.className = "person-avatar";
        avatar.textContent = iniciais(pessoa.nome || pessoa.email);

        const info = document.createElement("div");
        info.className = "person-info";

        const nome = document.createElement("strong");
        nome.textContent = pessoa.nome || "Usuário";

        const email = document.createElement("span");
        email.textContent = pessoa.email || "";

        info.append(nome, email);
        card.append(avatar, info);

        container.append(card);
    });

    const emailCriador = turmaAtual.criadoPor?.email ||
        turmaAtual.criadorEmail || "";

    const souCriador = emailLogado() &&
        emailLogado() === String(emailCriador).toLowerCase();

    $("editar-informacoes-turma").hidden = !souCriador;
}

$("copiar-codigo").addEventListener("click", async () => {
    if (!turmaAtual?.codigo) return;

    try {
        await navigator.clipboard.writeText(turmaAtual.codigo);
        mostrarToast("Código copiado!");
    } catch {
        mostrarToast("Não foi possível copiar o código.");
    }
});

// ==========================================
// EDITAR INFORMAÇÕES DA TURMA
// ==========================================

function abrirEdicaoTurma() {
    if (!turmaAtual) return;

    $("editar-nome-turma").value = turmaAtual.nome || "";
    $("editar-descricao-turma").value = turmaAtual.descricao || "";
    $("editar-materia-turma").value = turmaAtual.materia || "";
    $("editar-ano-turma").value = turmaAtual.ano_escolar || "";

    $("erro-editar-turma").textContent = "";
    $("form-editar-turma").hidden = false;
}

$("editar-informacoes-turma").addEventListener(
    "click",
    abrirEdicaoTurma
);

$("cancelar-edicao-turma").addEventListener("click", () => {
    $("form-editar-turma").hidden = true;
});

$("form-editar-turma").addEventListener("submit", async event => {
    event.preventDefault();

    if (!turmaAtual) return;

    const body = {
        nome: $("editar-nome-turma").value.trim(),
        descricao: $("editar-descricao-turma").value.trim(),
        materia: $("editar-materia-turma").value.trim(),
        ano_escolar: $("editar-ano-turma").value.trim()
    };

    try {
        const atualizada = await requisicao(
            `/turmas/${encodeURIComponent(turmaAtual.id)}`,
            {
                method: "PUT",
                body: JSON.stringify(body)
            }
        );

        Object.assign(turmaAtual, atualizada);

        $("form-editar-turma").hidden = true;

        preservarRolagem(() => renderizarPagina());

        mostrarToast("Informações atualizadas!");

    } catch (erro) {
        $("erro-editar-turma").textContent = erro.message;
    }
});

// ==========================================
// AVISOS - FORMULÁRIO
// ==========================================

function abrirFormularioAviso(aviso = null) {
    avisoEditando = aviso ? aviso.id : null;

    $("form-aviso").hidden = false;

    $("titulo-form-aviso").textContent =
        aviso ? "Editar aviso" : "Novo aviso";

    $("titulo-aviso").value = aviso?.titulo || "";
    $("conteudo-aviso").value = aviso?.conteudo || "";
    $("opcao-email-aviso").hidden = !!aviso;
    $("enviar-email-aviso").checked = false;
    $("erro-aviso").textContent = "";

    $("salvar-aviso").textContent =
        aviso ? "Salvar alterações" : "Publicar aviso";

    $("form-aviso").scrollIntoView({
        behavior: "smooth",
        block: "center"
    });
}

function fecharFormularioAviso() {
    $("form-aviso").hidden = true;
    $("form-aviso").reset();

    $("erro-aviso").textContent = "";
    avisoEditando = null;

    $("salvar-aviso").textContent = "Publicar aviso";
}

$("abrir-criar-aviso").addEventListener("click", () => {
    if (!usuarioLogado?.email) {
        mostrarToast("Entre na sua conta para publicar avisos.");
        return;
    }

    abrirFormularioAviso();
});

$("cancelar-aviso").addEventListener(
    "click",
    fecharFormularioAviso
);

// ==========================================
// PUBLICAR E EDITAR AVISOS
// ==========================================


// ==========================================
// PUBLICAR E EDITAR AVISOS
// ==========================================

$("form-aviso").addEventListener("submit", async event => {
    event.preventDefault();

    if (!turmaAtual) return;

    if (!emailLogado()) {
        $("erro-aviso").textContent =
            "Entre na sua conta para continuar.";
        return;
    }

    const titulo = $("titulo-aviso").value.trim();
    const conteudo = $("conteudo-aviso").value.trim();

    if (!titulo || !conteudo) {
        $("erro-aviso").textContent =
            "Preencha o título e a mensagem.";
        return;
    }

    const botao = $("salvar-aviso");
    botao.disabled = true;

    try {
        let aviso;

        if (avisoEditando) {
            aviso = await requisicao(
                `/turmas/${encodeURIComponent(turmaAtual.id)}/avisos/${encodeURIComponent(avisoEditando)}`,
                {
                    method: "PUT",
                    body: JSON.stringify({
                        titulo,
                        conteudo,
                        autorEmail: emailLogado()
                    })
                }
            );

            const indice = turmaAtual.avisos.findIndex(
                a => String(a.id) === String(avisoEditando)
            );

            if (indice >= 0) {
                turmaAtual.avisos[indice] = aviso;
            }

            mostrarToast("Aviso editado!");

        } else {
            aviso = await requisicao(
                `/turmas/${encodeURIComponent(turmaAtual.id)}/avisos`,
                {
                    method: "POST",
                    body: JSON.stringify({
                        titulo,
                        conteudo,
                        autorEmail: emailLogado(),
                        enviarEmail: $("enviar-email-aviso").checked
                    })
                }
            );

            turmaAtual.avisos.unshift(aviso);

            if (aviso.emailEnvio?.sucesso) {
                mostrarToast(
                    `Aviso publicado! ${aviso.emailEnvio.enviados} e-mails enviados.`
                );
            } else if (aviso.emailEnvio && !aviso.emailEnvio.sucesso) {
                mostrarToast(
                    "Aviso publicado, mas houve um erro no envio dos e-mails: " +
                    aviso.emailEnvio.mensagem
                );
            } else {
                mostrarToast("Aviso publicado!");
            }
        }

        fecharFormularioAviso();
        renderizarAvisos();

    } catch (erro) {
        $("erro-aviso").textContent = erro.message;
    } finally {
        botao.disabled = false;
    }
});

// ==========================================
// RENDERIZAR AVISOS
// ==========================================

function renderizarAvisos() {
    const container = $("lista-avisos");
    container.replaceChildren();

    if (!turmaAtual) return;

    const avisos = Array.isArray(turmaAtual.avisos)
        ? turmaAtual.avisos
        : [];

    if (!avisos.length) {
        const vazio = document.createElement("div");
        vazio.className = "empty-state";

        const titulo = document.createElement("h3");
        titulo.textContent = "Nenhum aviso por enquanto";

        const texto = document.createElement("p");
        texto.textContent =
            "Quando alguém publicar um aviso, ele aparecerá aqui.";

        vazio.append(titulo, texto);
        container.append(vazio);
        return;
    }

    avisos.forEach(aviso => {
        const card = document.createElement("article");
        card.className = "notice-card";

        const cabecalho = document.createElement("div");
        cabecalho.className = "notice-header";

        const autor = document.createElement("div");
        autor.className = "notice-author";

        const avatar = document.createElement("span");
        avatar.className = "person-avatar";
        avatar.textContent = iniciais(aviso.autor?.nome);

        const dadosAutor = document.createElement("div");

        const nome = document.createElement("strong");
        nome.textContent = aviso.autor?.nome || "Usuário";

        const data = document.createElement("small");
        data.textContent = formatarData(aviso.criadoEm);

        dadosAutor.append(nome, data);
        autor.append(avatar, dadosAutor);

        cabecalho.append(autor);

        const meuAviso = emailLogado() &&
            emailLogado() ===
            String(aviso.autor?.email || "").toLowerCase();

        if (meuAviso) {
            const editar = document.createElement("button");
            editar.type = "button";
            editar.className = "text-button";
            editar.textContent = "Editar";

            editar.addEventListener("click", () => {
                abrirFormularioAviso(aviso);
            });

            cabecalho.append(editar);
        }

        const titulo = document.createElement("h3");
        titulo.className = "notice-title";
        titulo.textContent = aviso.titulo || "Aviso";

        const conteudo = document.createElement("p");
        conteudo.className = "notice-content";
        conteudo.textContent = aviso.conteudo || "";

        card.append(cabecalho, titulo, conteudo);

        if (aviso.editadoEm) {
            const editado = document.createElement("small");
            editado.className = "notice-edited";
            editado.textContent =
                `Editado em ${formatarData(aviso.editadoEm)}`;

            card.append(editado);
        }

        const visualizacoes = aviso.visualizacoes || [];

        const jaViu = visualizacoes.some(
            v => String(v.email).toLowerCase() === emailLogado()
        );

        const areaAcoes = document.createElement("div");
        areaAcoes.className = "notice-actions";

        const visto = document.createElement("button");
        visto.type = "button";
        visto.className = "button button-quiet";
        visto.textContent = jaViu ? "✓ Visto" : "Marcar como visto";
        visto.disabled = jaViu || !emailLogado();

        visto.addEventListener("click", () => {
            marcarComoVisto(aviso.id);
        });

        const quantidadeVistos = document.createElement("span");
        quantidadeVistos.className = "notice-seen-count";
        quantidadeVistos.textContent =
            `${visualizacoes.length} ${visualizacoes.length === 1 ? "visualização" : "visualizações"}`;

        areaAcoes.append(visto, quantidadeVistos);

        card.append(areaAcoes);

        // COMENTÁRIOS

        const comentariosArea = document.createElement("section");
        comentariosArea.className = "comments-area";

        const tituloComentarios = document.createElement("h4");
        tituloComentarios.textContent =
            `Comentários (${(aviso.comentarios || []).length})`;

        comentariosArea.append(tituloComentarios);

        const listaComentarios = document.createElement("div");
        listaComentarios.className = "comments-list";

        (aviso.comentarios || []).forEach(comentario => {
            const item = document.createElement("article");
            item.className = "comment-item";

            const nomeComentario = document.createElement("strong");
            nomeComentario.textContent =
                comentario.autor?.nome || "Usuário";

            const textoComentario = document.createElement("p");
            textoComentario.textContent = comentario.texto;

            const dataComentario = document.createElement("small");
            dataComentario.textContent =
                formatarData(comentario.criadoEm);

            item.append(
                nomeComentario,
                textoComentario,
                dataComentario
            );

            listaComentarios.append(item);
        });

        comentariosArea.append(listaComentarios);

        const formComentario = document.createElement("form");
        formComentario.className = "comment-form";

        const campoComentario = document.createElement("input");
        campoComentario.type = "text";
        campoComentario.placeholder = "Escreva um comentário...";
        campoComentario.maxLength = 2000;
        campoComentario.required = true;

        const enviarComentario = document.createElement("button");
        enviarComentario.type = "submit";
        enviarComentario.className = "button button-primary";
        enviarComentario.textContent = "Enviar";
        enviarComentario.disabled = !emailLogado();

        formComentario.append(campoComentario, enviarComentario);

        formComentario.addEventListener("submit", async event => {
            event.preventDefault();

            const texto = campoComentario.value.trim();

            if (!texto) return;

            enviarComentario.disabled = true;

            try {
                const comentario = await requisicao(
                    `/turmas/${encodeURIComponent(turmaAtual.id)}/avisos/${encodeURIComponent(aviso.id)}/comentarios`,
                    {
                        method: "POST",
                        body: JSON.stringify({
                            texto,
                            autorEmail: emailLogado()
                        })
                    }
                );

                if (!Array.isArray(aviso.comentarios)) {
                    aviso.comentarios = [];
                }

                aviso.comentarios.push(comentario);

                preservarRolagem(() => renderizarAvisos());

                mostrarToast("Comentário enviado!");

            } catch (erro) {
                mostrarToast(erro.message);
                enviarComentario.disabled = false;
            }
        });

        comentariosArea.append(formComentario);
        card.append(comentariosArea);

        container.append(card);
    });
}

// ==========================================
// MARCAR AVISO COMO VISTO
// ==========================================

async function marcarComoVisto(avisoId) {
    if (!emailLogado() || !turmaAtual) {
        mostrarToast("Entre na sua conta para continuar.");
        return;
    }

    try {
        const resultado = await requisicao(
            `/turmas/${encodeURIComponent(turmaAtual.id)}/avisos/${encodeURIComponent(avisoId)}/visto`,
            {
                method: "POST",
                body: JSON.stringify({
                    email: emailLogado()
                })
            }
        );

        const aviso = turmaAtual.avisos.find(
            a => String(a.id) === String(avisoId)
        );

        if (aviso) {
            aviso.visualizacoes = resultado.visualizacoes;
        }

        preservarRolagem(() => renderizarAvisos());

        mostrarToast("Aviso marcado como visto!");

    } catch (erro) {
        mostrarToast(erro.message);
    }
}

// ==========================================
// ENTRAR EM TURMA
// ==========================================

$("form-ingressar-turma").addEventListener("submit", async event => {
    event.preventDefault();

    const campoCodigo = $("codigo-turma");
    const mensagem = $("mensagem-ingresso");

    const codigo = campoCodigo.value.trim().toUpperCase();

    if (!emailLogado()) {
        mensagem.textContent =
            "Entre na sua conta para ingressar em uma turma.";
        return;
    }

    mensagem.textContent = "Verificando código...";

    try {
        const resultado = await requisicao("/turmas/entrar", {
            method: "POST",
            body: JSON.stringify({
                codigo,
                email: emailLogado()
            })
        });

        mensagem.textContent = resultado.mensagem;
        campoCodigo.value = "";

        await carregarDados();

    } catch (erro) {
        mensagem.textContent = erro.message;
    }
});

// ==========================================
// NAVEGAÇÃO E BOTÕES
// ==========================================

[
    "abrir-criacao",
    "abrir-criacao-vazio",
    "abrir-criacao-topo",
    "abrir-criacao-lateral"
].forEach(id => {
    $(id).addEventListener("click", abrirModal);
});

$("fechar-modal").addEventListener("click", fecharModal);
$("cancelar-modal").addEventListener("click", fecharModal);

modal.addEventListener("click", event => {
    if (event.target.dataset.closeModal === "true") {
        fecharModal();
    }
});

document.addEventListener("keydown", event => {
    if (event.key === "Escape") {
        if (!modal.hidden) fecharModal();
        if (!$("form-aviso").hidden) fecharFormularioAviso();
    }
});

buscaPessoas.addEventListener("input", renderizarUsuarios);

$("voltar-inicio").addEventListener("click", voltarInicio);

$("nav-inicio").addEventListener("click", () => {
    voltarInicio();

    if (window.innerWidth <= 760) {
        $("sidebar").classList.remove("sidebar-open");
    }
});

$("brand-link").addEventListener("click", event => {
    event.preventDefault();
    voltarInicio();
});

$("toggle-sidebar").addEventListener("click", () => {
    $("sidebar").classList.toggle("sidebar-open");
});

$("perfil").addEventListener("click", () => {
    if (usuarioLogado) {
        mostrarToast(`Conectado como ${nomeLogado()}`);
    } else {
        mostrarToast("Você não está identificado. Faça login novamente.");
    }
});

// ==========================================
// INICIAR
// ==========================================

if (usuarioLogado?.nome) {
    $("perfil").textContent = iniciais(usuarioLogado.nome);
}

// Impede que formulários provoquem recarregamentos nativos.
document.addEventListener("submit", event => {
    event.preventDefault();
}, true);

carregarDados();
