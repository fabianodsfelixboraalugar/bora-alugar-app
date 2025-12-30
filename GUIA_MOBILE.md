# Guia: Transformando o AlugaTudo em App (Android/iOS)

Este projeto já está configurado para ser transformado em um aplicativo nativo usando **Capacitor**.

Como a IA não pode rodar "builds" nativos na nuvem, você precisará seguir estes passos no seu computador quando decidir publicar na loja.

## Pré-requisitos
No seu computador, você precisará instalar:
1.  **Node.js** (Para rodar o JavaScript)
2.  **Android Studio** (Para gerar o app Android)
3.  **VS Code** (Para editar o código)

## Passo a Passo

### 1. Preparar o Projeto
Abra o terminal na pasta do projeto e instale as dependências:

```bash
# Inicia o projeto como um pacote Node (se ainda não tiver package.json)
npm init -y

# Instala o React e ferramentas de build (Vite)
npm install react react-dom vite @vitejs/plugin-react

# Instala o núcleo do Capacitor
npm install @capacitor/core @capacitor/cli @capacitor/android
```

### 2. Configurar o Build
Crie um arquivo chamado `vite.config.js` na raiz do projeto com este conteúdo, para garantir que o código seja empacotado corretamente:

```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
  }
})
```

### 3. Gerar a Versão Mobile
Agora vamos transformar o código do site em código de app.

```bash
# 1. Constrói o site (gera a pasta 'dist')
npm run build 
# (Nota: adicione "build": "vite build" no seu package.json scripts)

# 2. Inicializa o Capacitor (apenas na primeira vez)
npx cap init AlugaTudo com.alugatudo.app

# 3. Adiciona a plataforma Android
npx cap add android

# 4. Sincroniza seus arquivos com o projeto Android
npx cap sync
```

### 4. Abrir no Android Studio
O comando final vai abrir o Android Studio automaticamente com seu projeto carregado:

```bash
npx cap open android
```

Lá dentro, basta clicar no botão **Play (Run)** para testar no emulador, ou conectar seu celular USB e rodar direto nele.

### 5. Gerar o APK para a Loja
No Android Studio:
1.  Vá em menu **Build** > **Generate Signed Bundle / APK**.
2.  Escolha **Android App Bundle** (para Play Store).
3.  Crie uma chave de assinatura (guarde a senha!).
4.  O arquivo final será gerado e você pode subir no painel da Google Play Console.

---

## Dicas para Publicação
*   **Ícones:** Substitua os ícones padrão na pasta `android/app/src/main/res` pelos ícones do AlugaTudo.
*   **Permissões:** Se usar Câmera ou Geolocalização, verifique o arquivo `AndroidManifest.xml` dentro da pasta android.
