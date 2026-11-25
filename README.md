# Plataforma HomeoFormula 
Projeto de Extensão Curricular (PCE) do curso de Ciência da Computação da Universidade Católica de Santos (UniSantos).

# Sobre o Projeto
A Plataforma HomeoFormula é uma solução web desenvolvida para a Farmácia de Manipulação Homeofórmula, localizada em Santos - SP. O objetivo principal é otimizar e digitalizar o fluxo de atendimento da empresa, centralizando as interações em um ambiente escalável que proporciona maior autonomia para os clientes e eficiência operacional para a equipe.

A aplicação funciona como uma Área do Cliente web descentralizada e integrada ao ERP legado da farmácia, permitindo que os usuários realizem suas demandas essenciais de forma 100% autônoma.

# Funcionalidades Principais (Escopo)
Módulo de Autoatendimento: Permite a solicitação autônoma de orçamentos com upload de receitas médicas e apresentação de sugestões de produtos complementares.

Renovação "1 Clique": Possibilita o reenvio simplificado de pedidos históricos com dados pré-preenchidos no sistema.

Grupo Família: Criação e gerenciamento de subperfis para administrar de forma centralizada o histórico de parentes e pets.

Integração via API com ERP: Sincronização automatizada de dados, receitas e orçamentos estruturados em formato JSON/XML.

# Arquitetura, Tecnologias e Ferramentas
Para garantir a manutenibilidade, a escalabilidade e o desacoplamento entre a lógica de negócio e os agentes de infraestrutura externa, o sistema adota rigorosamente a Arquitetura Hexagonal (Ports and Adapters). Esta abordagem foi formalizada e aceita através do documento de decisão arquitetural ADR-001.

# Stack Tecnológica
Frontend: React

Backend: NestJS

Banco de Dados Relacional: PostgreSQL

Armazenamento de Objetos: MinIO (utilizado como servidor S3 para gerenciar o upload de receitas)

Conteinerização: Docker para isolamento e orquestração dos serviços de infraestrutura

ORM: Prisma (para mapeamento e persistência de dados)

Ferramentas de Desenvolvimento e Gestão
IDE: Visual Studio Code

Controle de Versão e Repositório: GitHub

Gestão e Documentação do Projeto: Google Workspace

# Como rodar o projeto
1. Certifique-se de ter o [Docker](https://www.docker.com/) instalado em sua máquina.
2. Clone o repositório.
3. Na raiz do projeto, execute o comando:
   ```bash
   docker-compose up -d
   ```
4. O sistema estará disponível nas portas definidas nos arquivos de configuração do Docker.

# Documentação Oficial
Para acessar os diagramas, artefatos de planejamento, atas de reunião e etc, visite o nosso repositório de documentação: [HomeoFormula-Docs](https://github.com/HomeoFormula-PCE-UniSantos/homeoformula-docs)

# Equipe de Desenvolvimento
O planejamento e a execução do projeto são conduzidos pelos alunos da graduação em Ciência da Computação:

Arthur Batista Correa Alves

Felipe Francisco Ferreira de Lima

Guilherme Augusto Boquimpani

Milton Silva de Jesus

Product Owner (PO): Luiz Alberto Coelho Barbosa

# Metodologia de Governança:
Abordagem híbrida, combinando as diretrizes do guia PMBOK para o gerenciamento e planejamento macro com o framework Scrum para a execução dos ciclos ágeis de desenvolvimento.
