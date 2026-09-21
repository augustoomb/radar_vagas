# Radar de Vagas

Dashboard pessoal para acompanhar vagas de **Desenvolvedor Júnior Back-end / Java** publicadas nas plataformas **Gupy** e **InHire**.

O foco é encontrar oportunidades **remotas em qualquer lugar do Brasil** ou, quando presenciais/híbridas, limitadas a **Belo Horizonte e Contagem (MG)**.

---

## O que ele faz

- Roda sozinho em containers Docker.
- Busca vagas automaticamente nas APIs públicas da Gupy e InHire.
- Filtra por cargo júnior (Java, Backend, Java Backend, Software Engineer, Analista Desenvolvedor).
- Mantém apenas vagas remotas **OU** presenciais/híbridas em BH/Contagem/MG.
- Mostra tudo num dashboard web com filtros por plataforma, cargo, tipo de vaga e local.
- Permite marcar vagas como **detectada**, **candidatado**, **enviada** (JobSync) ou **não aplicável**.
- Agenda automática: o scraper roda às **8h, 12h e 18h** todos os dias.

---

## Tecnologias

- **Rails 8** + **PostgreSQL** — dashboard e banco de dados.
- **Node.js** — pipeline de scraping.
- **Docker + Docker Compose** — orquestração de tudo.

---

## Pré-requisitos

- [Docker](https://docs.docker.com/get-docker/)
- [Docker Compose](https://docs.docker.com/compose/install/)

Não é necessário instalar Ruby, Node ou Postgres na máquina host. Tudo roda dentro dos containers.

---

## Como rodar pela primeira vez

1. Clone o repositório:

```bash
git clone git@github.com:augustoomb/radar_vagas.git
cd radar_vagas
```

2. Suba o ambiente de desenvolvimento:

```bash
docker compose -f docker-compose-dev.yml up --build
```

Na primeira execução o Docker vai buildar as imagens do Rails e do scraper. Pode demorar alguns minutos.

3. Importe a lista de empresas-alvo (vinda do arquivo `empresas.xlsx`):

```bash
docker compose -f docker-compose-dev.yml exec web bin/rails empresas:importar
```

4. Acesse o dashboard:

```bash
http://localhost:3000
```

5. O scraper já vai ter rodado uma vez no boot. Para forçar uma nova rodada:

```bash
docker compose -f docker-compose-dev.yml exec scraper /entrypoint.sh once
```

---

## Como usar o dashboard

### Filtros disponíveis

- **Busca**: empresa, título da vaga ou categoria.
- **Categoria**: Java Backend Developer Júnior, Java Developer Júnior, Backend Developer Júnior, Software Engineer Júnior.
- **Plataforma**: Gupy ou InHire.
- **Tipo**: remoto, híbrido, presencial etc.
- **Local**: filtre por `BR`, `BH`, `Contagem`, `MG` etc.
- **Na lista**: vagas de empresas que você cadastrou como alvo.
- **Status**: Detectadas, Candidatadas, Enviadas, Não aplicável.

### Status das vagas

| Status | Significado |
|---|---|
| **Detectada** | Vaga encontrada pelo scraper. Ainda não houve ação. |
| **Candidatado** | Você já se candidatou. Use o campo de observação para anotar detalhes. |
| **Enviada** | Vaga enviada para o JobSync (só funciona se o JobSync estiver configurado). |
| **Não aplicável** | Vaga descartada. |

### Cadastrar empresas

Acesse **"empresas cadastradas"** no menu. Empresas na sua lista aparecem marcadas como "Na lista: Sim" no dashboard, o que ajuda a priorizar.

A lista inicial vem do arquivo `busca-vagas-gupy-inhire/empresas.xlsx`. Você pode editar, adicionar ou remover empresas pela interface.

---

## Como funciona o scraper

O pipeline é dividido em duas fontes:

### Gupy

A Gupy expõe uma API pública de busca. O scraper consulta termos como "Java", "Desenvolvedor Java", "Backend Java", "Software Engineer" etc. e mantém as vagas que casam com cargos júnior.

### InHire

A InHire não tem busca global. Cada empresa tem um subdomínio próprio (`empresa.inhire.app`). O scraper:

1. Tenta descobrir os subdomínios das empresas da sua lista.
2. Faz uma varredura na web aberta (Wayback, urlscan, Common Crawl) para encontrar mais empresas InHire.
3. Lista as vagas abertas em cada subdomínio.

### Filtro de local

Depois de coletar as vagas, o pipeline descarta:

- vagas presenciais/híbridas fora de BH/Contagem/MG;
- vagas que não casam com os cargos júnior configurados.

Vagas remotas são sempre mantidas, independente do local.

---

## Variáveis de ambiente (opcional)

Copie o exemplo:

```bash
cp .env.example .env
```

Variáveis úteis:

| Variável | Descrição |
|---|---|
| `JOBSYNC_URL` | URL do seu JobSync, se usar. |
| `JOBSYNC_TOKEN` | Token de acesso do JobSync. |
| `BASIC_AUTH_USER` | Usuário para proteger o dashboard. |
| `BASIC_AUTH_PASSWORD` | Senha para proteger o dashboard. |

Se `BASIC_AUTH_USER` e `BASIC_AUTH_PASSWORD` estiverem vazios, o dashboard fica aberto (padrão para uso local).

---

## Comandos úteis

```bash
# Subir tudo
docker compose -f docker-compose-dev.yml up --build

# Subir em segundo plano
docker compose -f docker-compose-dev.yml up -d

# Ver logs
docker compose -f docker-compose-dev.yml logs -f

# Forçar uma rodada do scraper
docker compose -f docker-compose-dev.yml exec scraper /entrypoint.sh once

# Importar empresas do xlsx
docker compose -f docker-compose-dev.yml exec web bin/rails empresas:importar

# Abrir console do Rails
docker compose -f docker-compose-dev.yml exec web bin/rails console

# Parar tudo
docker compose -f docker-compose-dev.yml down

# Parar e remover volumes (apaga o banco)
docker compose -f docker-compose-dev.yml down -v
```

---

## Estrutura do projeto

```
.
├── busca-vagas-gupy-inhire/   # Pipeline de scraping (Node.js)
│   ├── busca_vagas/           # Scripts do scraper
│   └── empresas.xlsx          # Lista inicial de empresas-alvo
├── rails/                     # Dashboard Rails
│   ├── app/                   # Controllers, models, views
│   ├── config/                # Configurações do Rails
│   └── lib/tasks/             # Rake tasks (importação de vagas e empresas)
├── docker-compose-dev.yml     # Compose para uso local
├── docker-compose.yml         # Compose para deploy com imagens prontas
└── README.md                  # Este arquivo
```

---

## Créditos

O pipeline de scraping original para Gupy e InHire nasceu no projeto [vonrondow/busca-vagas-gupy-inhire](https://github.com/vonrondow/busca-vagas-gupy-inhire). Este repositório adapta e estende esse pipeline para o perfil de vagas de desenvolvedor júnior back-end / Java, com dashboard próprio em Rails.
