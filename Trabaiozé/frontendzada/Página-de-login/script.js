const formLogin = document.getElementById("formLogin");

if (formLogin) {

    formLogin.addEventListener("submit", async (e) => {

        e.preventDefault();

        const email = document.getElementById("email").value;
        const senha = document.getElementById("senha").value;
        const mensagem = document.getElementById("mensagem");

        const resposta = await fetch("/login", {
            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                email,
                senha
            })
        });

        const dados = await resposta.json();

        mensagem.textContent = dados.mensagem;

        if (dados.sucesso) {
            mensagem.className = "sucesso";

            // Guarda o usuário enquanto o navegador estiver aberto
            sessionStorage.setItem(
                "usuario",
                JSON.stringify(dados.usuario)
            );

            setTimeout(() => {
                window.location.href = "painel.html";
            }, 1000);

        } else {
            mensagem.className = "erro";
        }
    });
}