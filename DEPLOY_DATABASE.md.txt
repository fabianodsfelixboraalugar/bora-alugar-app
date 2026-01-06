
# Guia de Deploy e Banco de Dados: Bora Alugar

Seu aplicativo agora está pronto para a "vida real". Siga estes passos para colocá-lo online com um banco de dados centralizado.

## 1. Hospedagem do Site (Onde ele mora)
Recomendo a **Vercel** (vercel.com).
1. Suba seu código para um repositório no **GitHub**.
2. Conecte sua conta na Vercel e importe o projeto.
3. Nas configurações (**Environment Variables**), adicione sua `API_KEY` do Gemini.
4. O site estará online em um endereço `.vercel.app`.

## 2. Banco de Dados Real (Supabase)
Atualmente o app salva tudo no navegador (IndexedDB). Para um site real, use o **Supabase** (supabase.com).
1. Crie um projeto gratuito no Supabase.
2. No menu **Table Editor**, crie as seguintes tabelas:
   - `users`: (id, name, email, plan, verified, ...)
   - `items`: (id, owner_id, title, price, images, ...)
   - `rentals`: (id, renter_id, item_id, start_date, ...)
3. Substitua as funções dentro de `DataContext.tsx` e `AuthContext.tsx`. 
   Exemplo de como ficaria a função `addItem`:
   ```javascript
   const addItem = async (item) => {
     const { data, error } = await supabase.from('items').insert([item]);
     if (error) throw error;
     setItems([data[0], ...items]);
   };
   ```

## 3. Upload de Fotos
No Supabase, crie um **Bucket** chamado `item-images`. 
- No componente `AddItem.tsx`, mude a lógica para dar upload da foto no Bucket e salvar a URL no banco de dados, em vez de salvar a imagem inteira (Base64) como fazemos agora.

## 4. Segurança
Ao hospedar, nunca deixe chaves de API expostas no código. Use sempre `process.env.API_KEY`. O código atual já segue este padrão de segurança.

**Dúvidas?** Você já tem a estrutura de código ideal para fazer essa transição em menos de 1 hora!
