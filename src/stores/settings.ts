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
      prompt: '',
      setPrompt: (prompt) => set({ prompt }),
      langCodes: ['en'],
      setLangCodes: (langCodes) => set({ langCodes }),
    }),
    {
      name: 'settings',
    },
  ),
)