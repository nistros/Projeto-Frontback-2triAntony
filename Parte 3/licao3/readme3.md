ssssQuestão 1: Escreva um JSON com os dados de um aviso escolar.
R:

{
  "id": 1,
  "titulo": "Reunião de responsáveis",
  "data": "2026-07-15",
  "descricao": "Encontro para discutir o desempenho dos alunos"
}
Questão 2: Escreva um JSON com os dados de uma tarefa.
R:


{
  "id": 12,
  "titulo": "Exercícios de Matemática",
  "prazo": "2026-07-20",
  "status": "pendente"
}
Questão 3: Escreva o pedido e a resposta de um login com e-mail e senha.
R:  
Cliente envia:

http
POST /login HTTP/1.1
Host: localhost:3000
Content-Type: application/json

{
  "email": "ana@escola.com",
  "senha": "123456"
}
Servidor responde:

http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "mensagem": "Login realizado com sucesso",
  "token": "abc123xyz"
}
Questão 4: Explique por que o servidor usa o código 201 ao criar um registro.
R: O código 201 Created é usado porque confirma que um novo recurso foi criado com sucesso no servidor, deixando claro para o cliente que o cadastro deu certo e já existe no sistema.

Questão 5: Escreva o passo a passo completo de um cadastro de usuário, desde o preenchimento do formulário até a resposta do servidor.
R:

Cliente preenche o formulário com nome, e-mail e perfil.

Cliente envia requisição POST /usuarios com os dados em JSON.

Servidor valida os dados (checa se o e-mail já existe, se o perfil é válido etc.).

Servidor cria o registro no banco de dados.

Servidor responde com HTTP/1.1 201 Created e devolve mensagem de sucesso junto com o id do novo usuário.

Cliente recebe a confirmação e pode usar o id para futuras operações.