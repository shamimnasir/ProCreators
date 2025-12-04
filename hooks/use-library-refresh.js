import { create } from 'zustand'

// Global store for library refresh
export const useLibraryStore = create((set) => ({
  refreshTrigger: 0,
  triggerRefresh: () => set((state) => ({ refreshTrigger: state.refreshTrigger + 1 })),
}))
