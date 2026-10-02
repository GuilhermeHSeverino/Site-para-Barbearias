# 🏗️ Guia de Arquitetura e Organização do Projeto

Este documento define o padrão de organização do projeto para garantir escalabilidade, facilidade de manutenção e aplicação de princípios de **Clean Code**.

## 🎨 Frontend (React + Vite)

O frontend deve seguir uma separação clara entre a lógica de negócio, a interface do usuário e a infraestrutura de API.

### 📁 Estrutura de Pastas Sugerida

```text
src/
├── api/               # Configurações globais de API (ex: axios instance)
├── assets/            # Imagens, ícones e fontes globais
├── components/        # Componentes reutilizáveis divididos por domínio
│   ├── ui/            # Componentes genéricos (Buttons, Inputs, Modals, Badges)
│   ├── barber/        # Componentes exclusivos da área do Barbeiro
│   └── client/        # Componentes exclusivos da área do Cliente
├── hooks/             # Custom hooks para lógica de estado e API (ex: useAuth, useServices)
├── pages/             # Componentes de página (View) que orquestram a interface
├── services/          # Camada de serviço para chamadas de API organizadas por módulo
├── constants/         # Constantes globais, chaves de API e tokens
└── styles/            # CSS Global e variáveis de tema (Cores Premium)
```

### 🛠️ Princípios de Implementação
1. **Componentização Atômica:** Se um componente for usado em mais de dois lugares, ele deve ir para `components/ui`.
2. **Lógica Fora da View:** A lógica de chamadas de API deve ser movida para `services/` ou `hooks/`, deixando o componente focado apenas em renderizar a interface.
3. **Nomenclatura:**
   - Componentes: `PascalCase` (ex: `ServiceCard.jsx`).
   - Funções e Hooks: `camelCase` (ex: `useServices.js`).
   - Arquivos de Estilo: `kebab-case.css` (ex: `barber-layout.css`).

---

## ⚙️ Backend (Django REST Framework)

O backend deve seguir o padrão de separação de responsabilidades do Django, evitando lógica complexa dentro das `views`.

### 📁 Estrutura de Apps
Cada app (`barber`, `services`, `schedule`, etc) deve manter a seguinte consistência:

```text
app_name/
├── migrations/        # Histórico de alterações do banco de dados
├── models.py          # Definição de dados (Camada de Dados)
├── serializers.py     # Transformação de dados Model <-> JSON (Camada de Transferência)
├── views.py           # Orquestração de requisições e respostas (Camada de Controle)
├── urls.py            # Definição de endpoints (Roteamento)
└── tests.py           # Testes automatizados
```

### 🛠️ Princípios de Implementação
1. **Fat Models, Thin Views:** A lógica de negócio deve preferencialmente residir nos `models.py` ou em camadas de serviço separadas, mantendo as `views.py` simples.
2. **Permissões Explícitas:** Toda view deve ter `permission_classes` bem definidos para evitar vazamento de dados entre clientes e barbeiros.
3. **Serialização Limpa:** Use `read_only_fields` e `validate_<field>` nos serializers para garantir a integridade dos dados.

---

## 🚀 Fluxo de Refatoração
Para organizar o projeto sem quebrá-lo:
1. Criar a nova estrutura de pastas.
2. Mover um componente/arquivo por vez.
3. Atualizar os `imports` correspondentes.
4. Testar a funcionalidade imediatamente após a mudança.
