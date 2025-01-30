import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import { Subtitles } from '../types';

interface OriginSubtitlesState {
  subtitles: Subtitles | null;
  set: (subtitles: Subtitles) => void;
}

export const useOriginSubtitlesStore = create<OriginSubtitlesState>()(
  devtools(
    persist(
      (set) => ({
        subtitles: null,
        set: (subtitles) => set({ subtitles }),
      }),
      {
        name: 'subtitles',
      },
    ),
  ),
)