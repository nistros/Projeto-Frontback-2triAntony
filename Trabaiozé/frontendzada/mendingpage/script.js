const createSection = document.getElementById("createSection");
const joinSection = document.getElementById("joinSection");

const createOption = document.getElementById("createOption");
const joinOption = document.getElementById("joinOption");

const modal = document.getElementById("modal");
const classCode = document.getElementById("classCode");

const generatedCode = document.getElementById("code");
const emailCode = document.getElementById("emailCode");
const emailClass = document.getElementById("emailClass");

const toast = document.getElementById("toast");

const className = document.getElementById("className");
const classDescription = document.getElementById("classDescription");

const classSubject = document.getElementById("classSubject");
const classTeacher = document.getElementById("classTeacher");
const classYear = document.getElementById("classYear");

const classesList = document.getElementById("classesList");
const cancelEditButton = document.getElementById("cancelEditButton");

let editingClassId = null;


/* ==========================================
   MOSTRAR CRIAR
========================================== */

function showCreate() {
    createSection.classList.remove("hidden");
    joinSection.classList.add("hidden");

    createOption.classList.add("active");
    joinOption.classList.remove("active");
}


/* ==========================================
   MOSTRAR INGRESSAR
========================================== */

function showJoin() {
    createSection.classList.add("hidden");
    joinSection.classList.remove("hidden");

    createOption.classList.remove("active");
    joinOption.classList.add("active");
}


/* ==========================================
   CRIAR OU EDITAR TURMA
========================================== */

async function createClass() {
    const dados = {
        nome: className.value.trim(),
        descricao: classDescription.value.trim(),
        materia: classSubject.value.trim(),
        professor: classTeacher.value.trim(),
        ano_escolar: classYear.value
    };

    if (!dados.nome) {
        showToast("Digite o nome da turma.");
        return;
    }

    const botao = createSection.querySelector(".main-button");

    botao.disabled = true;

    try {
        const editando = editingClassId !== null;

        const url = editando
            ? `/api/turmas/${editingClassId}`
            : "/api/turmas";

        const resposta = await fetch(url, {
            method: editando ? "PUT" : "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(dados)
        });

        const resultado = await resposta.json();

        if (!resposta.ok) {
            throw new Error(
                resultado.erro || "Não foi possível salvar a turma."
            );
        }

        if (editando) {
            cancelarEdicao();
            await carregarTurmas();

            showToast("Turma atualizada com sucesso!");
            return;
        }

        // Utiliza os dados gerados pelo backend
        generatedCode.textContent = resultado.codigo;
        emailCode.textContent = resultado.codigo;
        emailClass.textContent = resultado.nome;

        // Limpa o formulário
        limparFormulario();

        await carregarTurmas();

        // Abre o modal de sucesso
        modal.classList.add("show");

    } catch (error) {
        console.error("Erro ao salvar turma:", error);

        showToast(
            error.message || "Erro ao conectar com o servidor."
        );
    } finally {
        botao.disabled = false;
    }
}


/* ==========================================
   LIMPAR FORMULÁRIO
========================================== */

function limparFormulario() {
    className.value = "";
    classDescription.value = "";
    classSubject.value = "";
    classTeacher.value = "";
    classYear.value = "";
}


/* ==========================================
   LISTAR TURMAS SALVAS NO JSON
========================================== */

async function carregarTurmas() {
    try {
        const resposta = await fetch("/api/turmas");
        const turmas = await resposta.json();

        if (!resposta.ok) {
            throw new Error("Erro ao carregar turmas.");
        }

        classesList.replaceChildren();

        if (turmas.length === 0) {
            const mensagem = document.createElement("p");
            mensagem.textContent = "Nenhuma turma cadastrada ainda.";

            classesList.appendChild(mensagem);
            return;
        }

        turmas.forEach(turma => {
            const card = document.createElement("div");
            card.className = "class-item";

            const titulo = document.createElement("h3");
            titulo.textContent = turma.nome;

            const descricao = document.createElement("p");
            descricao.textContent =
                turma.descricao || "Sem descrição.";

            const detalhes = document.createElement("p");

            detalhes.textContent = [
                turma.materia,
                turma.ano_escolar,
                turma.professor
            ].filter(Boolean).join(" • ");

            const codigo = document.createElement("p");
            codigo.textContent = `Código: ${turma.codigo}`;

            const botaoEditar = document.createElement("button");

            botaoEditar.type = "button";
            botaoEditar.className = "main-button";
            botaoEditar.textContent = "Editar turma";

            botaoEditar.addEventListener("click", () => {
                editarTurma(turma.id);
            });

            card.appendChild(titulo);
            card.appendChild(descricao);

            if (detalhes.textContent) {
                card.appendChild(detalhes);
            }

            card.appendChild(codigo);
            card.appendChild(botaoEditar);

            classesList.appendChild(card);
        });

    } catch (error) {
        console.error("Erro ao listar turmas:", error);

        classesList.textContent =
            "Não foi possível carregar as turmas.";
    }
}


/* ==========================================
   EDITAR TURMA
========================================== */

async function editarTurma(id) {
    try {
        const resposta = await fetch(`/api/turmas/${id}`);
        const turma = await resposta.json();

        if (!resposta.ok) {
            throw new Error(
                turma.erro || "Não foi possível buscar a turma."
            );
        }

        editingClassId = turma.id;

        className.value = turma.nome;
        classDescription.value = turma.descricao || "";

        classSubject.value = turma.materia || "";
        classTeacher.value = turma.professor || "";
        classYear.value = turma.ano_escolar || "";

        createSection.querySelector(".main-button").textContent =
            "Salvar alterações";

        cancelEditButton.classList.remove("hidden");

        showCreate();

        createSection.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });

    } catch (error) {
        console.error("Erro ao editar turma:", error);

        showToast(error.message || "Erro ao abrir a turma.");
    }
}


/* ==========================================
   CANCELAR EDIÇÃO
========================================== */

function cancelarEdicao() {
    editingClassId = null;

    limparFormulario();

    createSection.querySelector(".main-button").textContent =
        "Criar turma";

    cancelEditButton.classList.add("hidden");
}


/* ==========================================
   INGRESSAR EM UMA TURMA
========================================== */

async function joinClass() {
    const code = classCode.value.trim().toUpperCase();

    if (!code) {
        showToast("Digite o código da turma.");
        return;
    }

    try {
        const resposta = await fetch("/api/turmas/entrar", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                codigo: code
            })
        });

        const resultado = await resposta.json();

        if (!resposta.ok) {
            throw new Error(
                resultado.erro || "Código não encontrado."
            );
        }

        showToast(`Turma encontrada: ${resultado.turma.nome}`);

        console.log("Turma encontrada:", resultado.turma);

    } catch (error) {
        console.error("Erro ao ingressar:", error);

        showToast(
            error.message || "Erro ao verificar o código."
        );
    }
}


/* ==========================================
   FORMATAÇÃO DO CÓDIGO
========================================== */

classCode.addEventListener("input", function () {
    this.value = this.value
        .toUpperCase()
        .replace(/[^A-Z0-9-]/g, "");
});


/* ==========================================
   COPIAR CÓDIGO
========================================== */

async function copyCode() {
    const code = generatedCode.textContent.trim();

    try {
        await navigator.clipboard.writeText(code);

        showToast("Código copiado!");

    } catch (error) {
        console.error("Erro ao copiar:", error);

        showToast("Não foi possível copiar o código.");
    }
}


/* ==========================================
   FECHAR MODAL
========================================== */

function closeModal() {
    modal.classList.remove("show");
}

modal.addEventListener("click", function (event) {
    if (event.target === modal) {
        closeModal();
    }
});


/* ==========================================
   TOAST
========================================== */

function showToast(message) {
    toast.textContent = message;

    toast.classList.add("show");

    setTimeout(() => {
        toast.classList.remove("show");
    }, 2300);
}


/* ==========================================
   CARREGAR TURMAS AO ABRIR A PÁGINA
========================================== */

document.addEventListener("DOMContentLoaded", () => {
    carregarTurmas();
});