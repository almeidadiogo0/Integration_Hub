# Estrutura do Projeto Universal Integration Hub

Este documento detalha o propósito de cada arquivo e pasta do sistema, ajudando você a entender onde encontrar cada funcionalidade.

## 📂 Backend (`backend/`)
O cérebro do sistema, feito em **Django**.

### Diretórios Principais
*   **`backend/`**: Configurações globais do Django (`settings.py`, `urls.py`).
    *   `settings.py`: Configura banco de dados, CORS, e apps instalados.
*   **`core_hub/`**: O "coração" da aplicação.
    *   **`models.py`**: Define as tabelas do banco de dados (`IntegrationProfile`, `MappingTemplate`).
    *   **`serializers.py`**: Converte os modelos para JSON (para a API).
    *   **`views.py`**: A lógica das APIs (endpoints). É aqui que o comando `execute` é processado.
    *   **`engine.py`**: O motor de transformação. Contém as funções `UPPERCASE`, `REMOVE_PUNCTUATION`, etc.
    *   **`utils.py`**: Funções auxiliares, como o `DataFetcher` que busca dados externos.
    *   **`management/commands/sync_manifest.py`**: O script que lê o `manifest.json` e atualiza o banco de dados.

### Arquivos na Raiz
*   **`manifest.json`**: **Arquivo Mais Importante**. Define os perfis de Integração (Sources/Targets). É a "Configuração como Código".
*   **`manage.py`**: Comando padrão do Django para rodar o servidor (`runserver`), criar migrações, etc.
*   **`db.sqlite3`**: O banco de dados local.
*   **(Scripts de Teste removidos conforme solicitado)**

---

## 📂 Frontend (`frontend/`)
A interface visual, feita em **React** com **Vite** e **Tailwind CSS**.

### Diretórios Principais
*   **`src/`**: Todo o código fonte.
    *   **`components/`**: Peças da interface.
        *   `Dashboard.jsx`: A tela inicial com estatísticas e logs.
        *   `MappingsList.jsx`: A lista de templates criados.
        *   `MappingWizard.jsx`: O assistente passo-a-passo (Criação/Edição).
        *   `Step1Config.jsx` e `Step2Mapping.jsx`: Passos individuais do Wizard.
        *   `Layout.jsx`: A estrutura base (barra lateral, cabeçalho).
    *   **`services/`**: Comunicação com o Backend.
        *   `api.js`: Configuração do Axios para chamar a API (ex: `http://localhost:8000/api`).
*   **`public/`**: Arquivos estáticos (ícones, imagens).

### Arquivos na Raiz
*   **`vite.config.js`**: Configuração do servidor de desenvolvimento Frontend (ex: porta 5173/5174).
*   **`tailwind.config.js`**: Configuração do Design System (cores, fontes).
*   **`package.json`**: Lista as dependências do projeto (React, Axios, Lucide Icons).

---

## 🔄 Fluxo de Dados
1.  **Edição**: Você edita o `manifest.json`.
2.  **Sincronização**: Roda `python manage.py sync_manifest`. O Backend aprende os novos perfis.
3.  **Interface**: O Frontend (`src/`) consulta o Backend (`views.py`) e mostra os perfis no Wizard.
4.  **Criação**: Você cria um Template no Frontend -> Salva no Backend (`models.py`).
5.  **Execução**: O Backend (`engine.py`) pega os dados, transforma, e entrega o resultado.
