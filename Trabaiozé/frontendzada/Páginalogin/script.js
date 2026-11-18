
const formLogin = document.getElementById("formLogin");
const mensagem = document.getElementById("mensagem");

if (formLogin && mensagem) {
    formLogin.addEventListener("submit", async (event) => {
        event.preventDefault();

        const email = document.getElementById("email").value.trim();
        const senha = document.getElementById("senha").value;

        mensagem.textContent = "Entrando...";
        mensagem.style.color = "black";

        try {
            const resposta = await fetch("http://localhost:3000/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ email, senha })
            });

            const dados = await resposta.json();

            if (!resposta.ok || !dados.sucesso) {
                mensagem.textContent =
                    dados.mensagem || "E-mail ou senha incorretos.";
                mensagem.style.color = "red";
                return;
            }

            sessionStorage.setItem(
                "usuario",
                JSON.stringify(dados.usuario)
            );

            mensagem.textContent = "Login realizado!";
            mensagem.style.color = "green";

            setTimeout(() => {
                window.location.href = "http://127.0.0.1:5500/Trabaioz%C3%A9/frontendzada/homepage/home.html";
            }, 500);

        } catch (erro) {
            console.error("Erro no login:", erro);

            mensagem.textContent =
                "Não foi possível conectar ao servidor. Confira se ele está rodando.";
            mensagem.style.color = "red";
        }
    });
}
