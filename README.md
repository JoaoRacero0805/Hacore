# Hacoré · Presenças

App de presenças, reuniões e mural de avisos do **Acampamento Hacoré** (Hallel Escola, Franca/SP).

- **Login só com Google.** Nenhuma senha fica guardada.
- **Senha da reunião.** A coordenação define a senha de cada reunião e fala no fim. O campista digita a senha para marcar presença (maiúsculas, acentos e espaços não importam).
- **Presença com localização.** O campista só consegue marcar presença:
  - no horário da reunião: do início até as 23:59 do dia, por padrão;
  - dentro do raio do local: 150 m por padrão, contando também a imprecisão do GPS, até no máximo 100 m a mais.
- **A localização não é guardada.** Ela é usada só para conferir a distância na hora de marcar.
- **GPS falhou ou foi negado?** A presença é registrada com a etiqueta **"sem localização"**. A coordenação vê essas presenças num filtro e remove as suspeitas.
- **Zerar presenças** (depois de cada acampamento: Corpus Christi e novembro) começa um ciclo novo. A contagem volta a 0, mas o histórico fica guardado e pode ser exportado. Reuniões já agendadas passam para o ciclo novo.
- **Admins** (todos com os mesmos poderes) podem:
  - cadastrar reuniões e locais;
  - marcar e desmarcar presença de cada campista (o total é calculado, nunca digitado);
  - publicar no mural;
  - exportar em Excel;
  - adicionar outros admins.

## Stack

Next.js 16 (App Router, Server Actions) · Auth.js v5 (Google) · Neon Postgres (`@neondatabase/serverless`, SQL à mão) · ExcelJS · Tailwind 4 · Vitest + PGlite.

Todo acesso a dados passa por `src/lib/store` (interface `Store`). O navegador nunca fala com o banco.

## Rodar localmente

```bash
npm install
npm run dev
```

Sem variáveis de ambiente, o app abre em **modo demonstração**:
- usa um banco Postgres em memória (PGlite) com dados de exemplo;
- o login pede só um email (qualquer um). Para entrar como coordenação, use `admin@demo.hacore`.

> O ponto da Escola Hallel na demonstração é aproximado. No app de verdade, o ponto é marcado pelo admin (veja abaixo).

```bash
npm test     # regras de presença, ciclos, admins, mural (contra Postgres real em memória)
npm run lint # checagem de tipos
```

## Colocar no ar (Vercel)

1. **Importar o repositório** na Vercel (New Project → este repo).
2. **Banco:** no projeto da Vercel, vá em **Storage → Create Database → Neon** e conecte. A variável `DATABASE_URL` é criada sozinha.
3. **Criar as tabelas:** no painel do Neon, abra o **SQL Editor**, cole o conteúdo de [`db/schema.sql`](db/schema.sql) e clique em Run. A alternativa é `npx vercel env pull .env.local && npm run db:setup`.
4. **Login Google:**
   - No [Google Cloud Console](https://console.cloud.google.com/apis/credentials), crie: **Credenciais → Criar credenciais → ID do cliente OAuth → Aplicativo da Web**.
   - Em **URIs de redirecionamento autorizados**, coloque `https://SEU-DOMINIO.vercel.app/api/auth/callback/google`.
   - Na **Tela de consentimento OAuth**, publique o app em "Em produção". Assim qualquer conta Google entra, não só usuários de teste.
5. **Variáveis de ambiente** (Settings → Environment Variables):

   | Variável | Valor |
   |---|---|
   | `AUTH_SECRET` | gere com `npx auth secret` |
   | `AUTH_GOOGLE_ID` | ID do cliente do passo 4 |
   | `AUTH_GOOGLE_SECRET` | Chave secreta do passo 4 |
   | `ADMIN_EMAILS` | emails da coordenação separados por vírgula (admins fixos) |

   Confira se não ficou espaço ou quebra de linha no fim dos valores.
6. **Redeploy:** as variáveis só valem num deploy novo.
7. **Marcar o ponto da Escola Hallel:** entre como admin **pelo celular, estando na escola**, vá em **Painel → Locais** e toque em **"Usar minha localização atual"**. Depois salve. Enquanto o ponto não for definido, as presenças ficam como "sem localização".

## Estrutura

```
db/schema.sql                 tabelas (idempotente)
src/lib/store/                acesso ao banco (Postgres/Neon e PGlite)
src/lib/rules.ts              regra da presença (janela, raio, sem localização)
src/lib/geo.ts, time.ts       distância e horário de Brasília
src/app/(app)/                telas do campista: início, mural, perfil
src/app/admin/                painel: campistas, reuniões, mural, locais, admins e ciclos, exportar
tests/                        testes (Vitest + PGlite)
```
