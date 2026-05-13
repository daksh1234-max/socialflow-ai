import { create } from 'zustand';

interface PostDraft {
  content: string;
  platform: string;
  scheduledFor: Date | null;
  imageUri: string | null;
}

interface PostStore {
  draft: PostDraft;
  setDraft: (draft: Partial<PostDraft>) => void;
  resetDraft: () => void;
}

const initialDraft: PostDraft = {
  content: '',
  platform: 'Twitter',
  scheduledFor: null,
  imageUri: null,
};

export const usePostStore = create<PostStore>((set) => ({
  draft: initialDraft,
  setDraft: (newDraft) => set((state) => ({
    draft: { ...state.draft, ...newDraft }
  })),
  resetDraft: () => set({ draft: initialDraft }),
}));
