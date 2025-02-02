import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import { Subtitles } from '../types';

interface TranslatedSubtitlesState {
  translations: {
    [key: string]: Subtitles;
  };
  setTranslation: (translations: {
    [key: string]: Subtitles;
  }) => void;
  appendTranslation: (langCode: string, timeline: string, text: string) => void;
}

export const useTranslatedSubtitlesStore = create<TranslatedSubtitlesState>()(
  devtools(
    persist(
      (set) => ({
        translations: {},
        setTranslation: (translations) => set((prev) => ({ 
          ...prev,
          translations: translations,
        })),
        appendTranslation: (langCode, timeline, text) => set((prev) => {
          if (!prev.translations[langCode]) {
            prev.translations[langCode] = {};
          }
          prev.translations[langCode][timeline] = text;
          return prev;
        }),
      }),
      {
        name: 'translatedSubtitles',
      },
    ),
  ),
)