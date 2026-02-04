
import { IS_PREVIEW } from '../lib/supabase';

interface AIRequest {
  prompt: string;
  context?: any;
}

export const aiService = {
  async generateContent({ prompt, context }: AIRequest): Promise<string> {
    if (IS_PREVIEW) {
      console.log("[AI MOCK] Gerando resposta para:", prompt);
      
      // Simulação inteligente baseada em palavras-chave
      if (prompt.toLowerCase().includes("cidade")) return "São Paulo";
      if (prompt.toLowerCase().includes("ajuda")) return "Como posso ajudar você com seu aluguel hoje?";
      
      return "Esta é uma resposta simulada da IA no modo Preview.";
    }

    // Futura implementação real via edge function para segurança da API KEY
    try {
      const response = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, context })
      });
      const data = await response.json();
      return data.text;
    } catch (error) {
      console.error("AI Service Error:", error);
      return "Erro ao processar solicitação de IA.";
    }
  },

  async resolveCityFromCoords(lat: number, lng: number): Promise<string> {
    if (IS_PREVIEW) return "São Paulo";
    
    return this.generateContent({ 
      prompt: `Retorne APENAS o nome da cidade desta localização: lat ${lat}, lng ${lng}.` 
    });
  }
};
