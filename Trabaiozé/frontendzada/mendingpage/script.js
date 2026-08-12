const createSection =
    document.getElementById("createSection");

const joinSection =
    document.getElementById("joinSection");

const createOption =
    document.getElementById("createOption");

const joinOption =
    document.getElementById("joinOption");

const modal =
    document.getElementById("modal");

const classCode =
    document.getElementById("classCode");

const generatedCode =
    document.getElementById("code");

const emailCode =
    document.getElementById("emailCode");

const emailClass =
    document.getElementById("emailClass");

const toast =
    document.getElementById("toast");



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
   GERAR CÓDIGO
========================================== */

function generateCode() {

    const characters =
        "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

    let random = "";

    for (let i = 0; i < 4; i++) {

        random += characters[
            Math.floor(
                Math.random() * characters.length
            )
        ];

    }

    return "TUR-" + random;

}



/* ==========================================
   CRIAR TURMA
========================================== */

function createClass() {

    const name =
        document
            .getElementById("className")
            .value
            .trim();


    if (!name) {

        showToast(
            "Digite o nome da turma."
        );

        return;

    }


    const code =
        generateCode();


    generatedCode.textContent = code;

    emailCode.textContent = code;

    emailClass.textContent = name;


    modal.classList.add("show");

}



/* ==========================================
   INGRESSAR
========================================== */

function joinClass() {

    const code =
        classCode.value
            .trim()
            .toUpperCase();


    if (!code) {

        showToast(
            "Digite o código da turma."
        );

        return;

    }


    showToast(
        "Verificando código da turma..."
    );


    /*
        Futuramente:

        fetch("/api/turmas/entrar", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                codigo: code
            })
        });
    */

}



/* ==========================================
   FORMATAÇÃO DO CÓDIGO
========================================== */

classCode.addEventListener(
    "input",
    function () {

        this.value =
            this.value
                .toUpperCase()
                .replace(/[^A-Z0-9-]/g, "");

    }
);



/* ==========================================
   COPIAR
========================================== */

async function copyCode() {

    const code =
        generatedCode.textContent;


    try {

        await navigator
            .clipboard
            .writeText(code);


        showToast(
            "Código copiado!"
        );


    } catch (error) {

        console.error(error);

    }

}



/* ==========================================
   FECHAR MODAL
========================================== */

function closeModal() {

    modal.classList.remove("show");

}


modal.addEventListener(
    "click",
    function (event) {

        if (event.target === modal) {

            closeModal();

        }

    }
);



/* ==========================================
   TOAST
========================================== */

function showToast(message) {

    toast.textContent = message;

    toast.classList.add("show");


    setTimeout(
        () => toast.classList.remove("show"),
        2300
    );

}