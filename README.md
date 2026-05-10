# Questify - Improve your skills 

> Transforme sua rotina e produtividade em uma verdadeira jornada de RPG. Complete tarefas, ganhe XP, suba de nível e enfrente a Masmorra do Foco. Seus bons hábitos te deixam mais forte, mas cuidado: falhar nas suas missões diárias drenará o seu HP!

![Questify Preview](./public/logo-cacador.png) ## 📜 Sobre o Projeto

Questify é um app web gamificado projetado para acabar com a procrastinação. Misturando técnicas de gestão de tempo e metodologias de produtividade com elementos imersivos de RPG, o sistema recompensa a disciplina e pune a inatividade.

Os usuários assumem o papel de "Caçadores", onde projetos reais (como estudos, trabalho e saúde) se tornam missões que rendem Ouro e Experiência.

## ✨ Funcionalidades Principais (Features)

* **Autenticação Descomplicada:** Sistema de login completo (E-mail/Senha) e opção de **Acesso como Convidado** (Frictionless Onboarding) via Supabase.
* **Gestão de Status:** Acompanhamento em tempo real de HP (Vida), Nível, Ouro, e Atributos Clássicos (STR, INT, DEX, WIS, VIT).
* **Tríade de Tarefas:**
    * *Hábitos:* Ações contínuas positivas ou negativas.
    * *Missões Diárias:* Tarefas que resetam todos os dias. Penalizam o HP se ignoradas.
    * *Quadro de Missões:* Para metas de longo prazo e grandes projetos (One-time tasks).
* **Masmorra de Foco:** Um ambiente livre de distrações para sessões de *Deep Work*. Sair antes da hora resulta em punição do Sistema.
* **Economia e Inventário:** Gaste seu Ouro na Loja em recompensas personalizadas (ex: "Jogar 1h de videogame" ou "Comprar um livro").
* **Sistema de Conquistas e Títulos:** Desbloqueie títulos equipáveis (ex: "Monarca das Sombras", "O Imortal") ao manter combos de dias (Streak) ou atingir marcos de tarefas.
* **Tutorial Interativo:** *Onboarding* gamificado guiando o usuário pela interface no seu primeiro acesso.

## 🛠️ Tecnologias Utilizadas

Este projeto foi construído utilizando as seguintes tecnologias e arquiteturas:

* **[React 18](https://react.dev/)** + **[TypeScript](https://www.typescriptlang.org/)**: Tipagem estática e componentização escalável.
* **[Vite](https://vitejs.dev/)**: Bundler ultrarrápido para desenvolvimento local e otimização de build.
* **[Tailwind CSS](https://tailwindcss.com/)**: Estilização utility-first, modo escuro (Dark Mode) nativo e interface com efeitos *Glassmorphism*.
* **[Supabase](https://supabase.com/)**: Backend-as-a-Service (BaaS) fornecendo banco de dados PostgreSQL, Autenticação de Usuários e políticas de RLS.
* **[React Router Dom](https://reactrouter.com/)**: Gerenciamento de rotas e navegação Single Page Application (SPA).
* **Bibliotecas de UI/UX:** `lucide-react` (Ícones), `sonner` (Toasts de feedback), `react-joyride` (Tours interativos).

## 🚀 Como Executar Localmente

Siga as instruções abaixo para rodar o projeto na sua máquina local:

### Pré-requisitos
* Node.js (versão 18+ recomendada)
* Git
* Uma conta no Supabase (para as variáveis de ambiente)

### Passos

1. Clone o repositório:
```bash
git clone [https://github.com/SEU_USUARIO/Questify-Improve-your-life.git](https://github.com/SEU_USUARIO/Questify-Improve-your-life.git)
