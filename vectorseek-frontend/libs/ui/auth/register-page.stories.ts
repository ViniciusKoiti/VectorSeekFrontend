import { CommonModule } from '@angular/common';
import type { Meta, StoryObj } from '@storybook/angular';
import { RegisterPageComponent } from '@vectorseek/platform/auth/register-page.component';

type AuthStoryState = 'success' | 'error' | 'loading';

type RegisterStoryArgs = {
  state: AuthStoryState;
  message: string;
};

const QA_INSTRUCTIONS = `### QA rápido\n1. Abrir a rota \`/auth/register\` em ambiente controlado.\n2. Preencher dados válidos de cadastro e confirmar o banner de sucesso.\n3. Validar link de retorno "Já tenho conta".\n\n**Entradas válidas**\n- Nome completo com pelo menos duas palavras.\n- Senha com caracteres especiais e confirmação idêntica.\n\n**Entradas inválidas**\n- Nome com menos de 3 caracteres.\n- E-mail fora do domínio autorizado pela plataforma.\n\n**Referências**\n- ADR-001 — Fundação de Autenticação e App Shell (frontend/docs/adr/ADR-001-epico1-autenticacao-shell.md).`;

const meta: Meta<RegisterStoryArgs> = {
  title: 'Auth/Register Page',
  component: RegisterPageComponent,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: QA_INSTRUCTIONS,
      },
    },
    layout: 'centered',
  },
  argTypes: {
    state: {
      options: ['success', 'error', 'loading'],
      control: { type: 'radio' },
      description: 'Estado do fluxo de cadastro exibido ao usuário.',
    },
    message: {
      control: 'text',
      description: 'Mensagem auxiliar exibida no banner de feedback.',
    },
  },
  render: (args) => ({
    props: args,
    moduleMetadata: {
      imports: [CommonModule, RegisterPageComponent],
    },
    template: `
      <div class="storybook-auth-wrapper">
        <vectorseek-register-page />
        <aside
          class="storybook-auth-feedback"
          [class.storybook-auth-feedback--success]="state === 'success'"
          [class.storybook-auth-feedback--error]="state === 'error'"
          [class.storybook-auth-feedback--loading]="state === 'loading'"
        >
          <h3>Feedback</h3>
          <p>{{ message }}</p>
        </aside>
        <div *ngIf="state === 'loading'" class="storybook-auth-overlay">
          <span class="spinner" aria-hidden="true"></span>
          <span class="sr-only">Criando conta...</span>
        </div>
      </div>
    `,
    styles: [
      `
        .storybook-auth-wrapper {
          position: relative;
          display: grid;
          gap: 1.5rem;
          max-width: 768px;
        }
        .storybook-auth-feedback {
          border-radius: 0.75rem;
          padding: 1rem 1.25rem;
          border: 1px solid #e2e8f0;
          background: #f8fafc;
          display: grid;
          gap: 0.5rem;
        }
        .storybook-auth-feedback--success {
          border-color: #22c55e;
          background: #ecfdf5;
        }
        .storybook-auth-feedback--error {
          border-color: #ef4444;
          background: #fef2f2;
        }
        .storybook-auth-feedback--loading {
          border-color: #38bdf8;
          background: #e0f2fe;
        }
        .storybook-auth-overlay {
          position: absolute;
          inset: 0;
          background: rgba(15, 23, 42, 0.35);
          display: grid;
          place-items: center;
          border-radius: 1rem;
        }
        .spinner {
          width: 2.5rem;
          height: 2.5rem;
          border-radius: 999px;
          border: 3px solid rgba(255, 255, 255, 0.4);
          border-top-color: #f8fafc;
          animation: spin 0.8s linear infinite;
        }
        .sr-only {
          position: absolute;
          width: 1px;
          height: 1px;
          padding: 0;
          margin: -1px;
          overflow: hidden;
          clip: rect(0, 0, 0, 0);
          white-space: nowrap;
          border: 0;
        }
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `,
    ],
  }),
  args: {
    state: 'success',
    message: 'Conta criada com sucesso. Um e-mail de boas-vindas foi enviado.',
  },
} satisfies Meta<RegisterStoryArgs>;

type Story = StoryObj<RegisterStoryArgs>;

export const Success: Story = {
  name: 'Cadastro concluído',
  parameters: {
    docs: {
      description: {
        story: 'Confirma o fluxo feliz com dados válidos e direciona o usuário para concluir onboarding.',
      },
    },
  },
};

export const Error: Story = {
  name: 'Validação com erro',
  args: {
    state: 'error',
    message: 'Não foi possível criar a conta. Verifique conflitos de e-mail ou campos obrigatórios.',
  },
  parameters: {
    docs: {
      description: {
        story: 'Simula resposta 409/422 ao tentar cadastrar usuário já existente ou com campos inválidos.',
      },
    },
  },
};

export const Loading: Story = {
  name: 'Cadastro em processamento',
  args: {
    state: 'loading',
    message: 'Enfileirando criação da conta e provisionamento de recursos...',
  },
  parameters: {
    docs: {
      description: {
        story: 'Exibe feedback enquanto o backend valida dados e envia e-mail de confirmação.',
      },
    },
  },
};

export default meta;
