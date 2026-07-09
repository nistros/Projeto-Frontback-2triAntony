Cite dois exemplos de situações em que o navegador usaria o método GET.
R: Buscar alguma informação de login, buscar alguma receita.



Cite dois exemplos de situações em que o navegador usaria o método POST.
R: Criar um cadastro, adicionar pratos no restaurante


Explique com suas palavras o que significa o código de status 404.
R: Buscar alguma informação e não encontrar.

Explique o que acontece quando o servidor responde com 201.
R: significa que você conseguiu criar com sucesso.

Escreva um pedido e uma resposta HTTP para o cadastro de um aviso escolar.
R: # O navegador pede a lista de avisos
GET /avisos HTTP/1.1
Host: localhost:3000

# O servidor responde com os avisos
HTTP/1.1 200 OK
Content-Type: application/json

["Reunião de responsáveis", "Prova de Matemática"]