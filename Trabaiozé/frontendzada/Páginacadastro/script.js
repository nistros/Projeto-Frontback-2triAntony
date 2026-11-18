
const formCadastro = document.getElementById("formCadastro");

if (formCadastro) {
    const mensagem = document.getElementById("mensagem");

    formCadastro.addEventListener("submit", async (event) => {
        event.preventDefault();

        const nome = document.getElementById("nome").value.trim();
        const email = document.getElementById("email").value.trim();
        const senha = document.getElementById("senha").value;

        const senhaForte =
            senha.length >= 8 &&
            /[a-z]/.test(senha) &&
            /[A-Z]/.test(senha) &&
            /[0-9]/.test(senha) &&
            /[^A-Za-z0-9]/.test(senha);

        if (!senhaForte) {
            mensagem.textContent =
                "Use pelo menos 8 caracteres, incluindo maiúscula, minúscula, número e símbolo.";
            mensagem.style.color = "red";
            return;
        }

        mensagem.textContent = "Cadastrando...";
        mensagem.style.color = "black";

        try {
            const resposta = await fetch("http://localhost:3000/cadastro", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    nome,
                    email,
                    senha
                })
            });

            const dados = await resposta.json();

            mensagem.textContent =
                dados.mensagem || "Não foi possível realizar o cadastro.";

            if (resposta.ok && dados.sucesso) {
                mensagem.style.color = "green";
                formCadastro.reset();

                setTimeout(() => {
                    window.location.href = "../Páginalogin/login.html";
                }, 1000);
            } else {
                mensagem.style.color = "red";
            }
        } catch (erro) {
            console.error("Erro no cadastro:", erro);

            mensagem.textContent =
                "Erro ao conectar com o servidor. Confira se ele está rodando.";

            mensagem.style.color = "red";
        }
    });
}
