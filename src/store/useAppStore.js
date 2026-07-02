import { create } from "zustand";

const useAppStore = create((set) => ({
    project: null,

    files: [],

    findings: [],

    statistics: {},

    selectedFile: null,

    preview: "",

    loading: false,

    progress: 0,

    settings: {
        sanitizationLevel: "medium",
        ignoreDirectories: [
            "node_modules",
            ".git",
            "dist",
            "build"
        ]
    },

    setProject: (project) => set({ project }),

    setFiles: (files) => set({ files }),

    addFile: (file) =>
        set((state) => ({
            files: [...state.files, file]
        })),

    setFindings: (findings) => set({ findings }),

    setStatistics: (statistics) => set({ statistics }),

    setSelectedFile: (selectedFile) => set({ selectedFile }),

    setPreview: (preview) => set({ preview }),

    setLoading: (loading) => set({ loading }),

    setProgress: (progress) => set({ progress }),

    reset: () =>
        set({
            project: null,
            files: [],
            findings: [],
            statistics: {},
            selectedFile: null,
            preview: "",
            loading: false,
            progress: 0
        })
}));

export default useAppStore;