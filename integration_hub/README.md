# Universal Integration Hub

## 🚀 Guia de Configuração e Uso

Este guia explica como configurar o sistema para diferentes cenários: **APIs (Busca Ativa)**, **Webhooks (Passivo)** e **Sistemas de Destino (Target)**.

---

## 1. Configurando Conexões (`manifest.json`)
Toda a configuração de sistemas externos é feita no arquivo `backend/manifest.json`.

### A. Adicionando uma API para Busca Ativa (Active Fetch)
Use isso quando você quer que o Hub vá buscar os dados (GET) usando um ID (ex: CNPJ, Email).

**Exemplo: API de CNPJ**
```json
{
    "id": "cnpj-finder",
    "name": "CNPJ Finder API",
    "type": "SOURCE",
    "description": "Busca dados de empresas por CNPJ",
    "auth": { "type": "NONE" },
    "api_url": "https://brasilapi.com.br/api/cnpj/v1/{cnpj}", 
    "schema": {
        "fields": [
            "cnpj",
            "razao_social",
            "nome_fantasia",
            "logradouro"
        ]
    }
}
```
*   **Nota**: `{cnpj}` na URL será substituído dinamicamente pelo parâmetro que você passar na execução.

### B. Adicionando um Webhook (Passivo)
Use isso quando o sistema externo (ex: Stripe, GitHub) vai enviar os dados para o Hub (POST).

**Exemplo: Webhook de Pagamento**
```json
{
    "id": "stripe-webhook",
    "name": "Stripe Events",
    "type": "SOURCE",
    "description": "Recebe eventos de pagamento",
    "auth": { "type": "NONE" },
    "api_url": "", 
    "schema": {
        "fields": [
            "id",
            "type",
            "data.object.amount",
            "data.object.customer"
        ]
    }
}
```
*   **Importante**: Deixe `api_url` **vazio** (`""`). Isso diz ao sistema "Não busque nada, apenas aceite o que vier".

### C. Adicionando um Destino (Target)
Use isso para definir para onde os dados vão após a transformação.

**Exemplo: CRM Interno**
```json
{
    "id": "internal-crm",
    "name": "Meu CRM",
    "type": "TARGET",
    "description": "Sistema de Vendas",
    "auth": {
        "type": "BEARER",
        "token": "env:CRM_TOKEN"
    },
    "api_url": "https://crm.empresa.com/api/leads",
    "schema": {
        "fields": [
            "CustomerName",
            "TaxID",
            "EmailAddress"
        ]
    }
}
```
*   **Segurança**: Use `env:NOME_DA_VAR` para ler tokens de variáveis de ambiente, nunca deixe senhas fixas no arquivo.

---

## 2. Aplicando as Mudanças
Sempre que editar o `manifest.json`, você deve rodar este comando no terminal (dentro da pasta backend) para atualizar o sistema:

```bash
python manage.py sync_manifest
```

---

## 3. Criando Mapeamentos
1.  Abra o Frontend (`http://localhost:5173` ou `5174`).
2.  Clique em **New Template**.
3.  Escolha uma Origem (Source) e um Destino (Target).
4.  No Passo 2, faça o "De -> Para":
    *   **Source Path**: O campo que vem da API/Webhook (ex: `razao_social` ou `data.object.amount`).
    *   **Transformation**: Opcional (ex: `UPPERCASE` para "GOOGLE BRASIL").
    *   **Target Field**: O campo do seu CRM (ex: `CustomerName`).
5.  Salve e Ative.

---

## 4. Executando Integrações

### Modo Ativo (API Fetch)
Você envia o parâmetro (ex: CNPJ) e o Hub busca, transforma e retorna.
**POST** `http://localhost:8000/api/templates/{ID}/execute/`
```json
{
    "params": {
        "cnpj": "06990590000123"
    }
}
```

### Modo Passivo (Webhook)
O sistema externo envia o JSON completo.
**POST** `http://localhost:8000/api/templates/{ID}/execute/`
```json
{
    "id": "evt_123",
    "type": "payment_succeeded",
    "data": {
        "object": {
             "amount": 2000
        }
    }
}
```

---

## 5. Estrutura de Pastas
Para entender onde cada arquivo fica, consulte o arquivo `PROJECT_STRUCTURE.md` na raiz do projeto.
