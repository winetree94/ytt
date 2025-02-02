import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { GPT_MODELS } from '../tools/gpt';

interface SettingsState {
  openAIApiKey: string;
  setOpenAIApiKey: (openAIApiKey: string) => void;
  model: string;
  setModel: (model: string) => void;
  prompt: string;
  setPrompt: (prompt: string) => void;
  baseLangCode: string;
  setBaseLangCode: (baseLangCode: string) => void;
  contextLength: number;
  setContextLength: (contextLength: number) => void;
  langCodes: string[];
  setLangCodes: (langCodes: string[]) => void;
}

export const useSettingsState = create<SettingsState>()(
  persist(
    (set) => ({
      openAIApiKey: '',
      setOpenAIApiKey: (openAIApiKey) => set({ openAIApiKey }),
      model: GPT_MODELS.GPT_4_O_MINI,
      setModel: (model) => set({ model }),
      prompt: 'For currency, change it to the local currency based on the exchange rate.',
      setPrompt: (prompt) => set({ prompt }),
      baseLangCode: 'ko',
      setBaseLangCode: (baseLangCode) => set({ baseLangCode }),
      contextLength: 15,
      setContextLength: (contextLength) => set({ contextLength }),
      langCodes: ['en'],
      setLangCodes: (langCodes) => set({ langCodes }),
    }),
    {
      name: 'settings',
    },
  ),
)