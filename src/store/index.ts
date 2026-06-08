import { create } from 'zustand'
import { v4 as uuidv4 } from 'uuid'
import type {
  TestCase,
  TestSuite,
  Device,
  ExecutionRecord,
  Defect,
  Project,
  ProjectSettings,
  ExecutionLog,
  TestStep,
} from '@/types'
import {
  mockCases,
  mockSuites,
  mockDevices,
  mockDefects,
  mockExecutions,
  mockProjects,
  defaultProjectSettings,
} from '@/mock/data'

interface AppState {
  cases: TestCase[]
  suites: TestSuite[]
  devices: Device[]
  executions: ExecutionRecord[]
  defects: Defect[]
  projects: Project[]
  currentProjectId: string
  currentExecutionId: string | null
  selectedTags: string[]
  searchKeyword: string

  addCase: (caseData: Omit<TestCase, 'id' | 'createdAt' | 'updatedAt'>) => void
  updateCase: (id: string, caseData: Partial<TestCase>) => void
  deleteCase: (id: string) => void
  getCaseById: (id: string) => TestCase | undefined

  addSuite: (suiteData: Omit<TestSuite, 'id' | 'createdAt' | 'updatedAt'>) => void
  updateSuite: (id: string, suiteData: Partial<TestSuite>) => void
  deleteSuite: (id: string) => void
  reorderSuiteCases: (suiteId: string, caseIds: string[]) => void

  updateDevice: (id: string, deviceData: Partial<Device>) => void
  addDevice: (device: Omit<Device, 'id'>) => void
  deleteDevice: (id: string) => void

  addExecution: (execution: Omit<ExecutionRecord, 'id' | 'logs' | 'results'>) => string
  updateExecution: (id: string, data: Partial<ExecutionRecord>) => void
  addExecutionLog: (executionId: string, log: Omit<ExecutionLog, 'id'>) => void
  setCurrentExecution: (id: string | null) => void

  addDefect: (defect: Omit<Defect, 'id' | 'createdAt' | 'updatedAt'>) => void
  updateDefect: (id: string, data: Partial<Defect>) => void
  deleteDefect: (id: string) => void

  addProject: (name: string) => void
  updateProjectSettings: (projectId: string, settings: Partial<ProjectSettings>) => void
  setCurrentProject: (id: string) => void

  setSelectedTags: (tags: string[]) => void
  setSearchKeyword: (keyword: string) => void
  getAllTags: () => string[]

  getFilteredCases: () => TestCase[]
}

export const useAppStore = create<AppState>((set, get) => ({
  cases: mockCases,
  suites: mockSuites,
  devices: mockDevices,
  executions: mockExecutions,
  defects: mockDefects,
  projects: mockProjects,
  currentProjectId: mockProjects[0].id,
  currentExecutionId: null,
  selectedTags: [],
  searchKeyword: '',

  addCase: (caseData) => {
    const now = new Date().toLocaleString()
    const newCase: TestCase = {
      ...caseData,
      id: uuidv4(),
      createdAt: now,
      updatedAt: now,
    }
    set((state) => ({ cases: [...state.cases, newCase] }))
  },

  updateCase: (id, caseData) => {
    const now = new Date().toLocaleString()
    set((state) => ({
      cases: state.cases.map((c) =>
        c.id === id ? { ...c, ...caseData, updatedAt: now } : c
      ),
    }))
  },

  deleteCase: (id) => {
    set((state) => ({
      cases: state.cases.filter((c) => c.id !== id),
      suites: state.suites.map((s) => ({
        ...s,
        caseIds: s.caseIds.filter((cid) => cid !== id),
      })),
    }))
  },

  getCaseById: (id) => {
    return get().cases.find((c) => c.id === id)
  },

  addSuite: (suiteData) => {
    const now = new Date().toLocaleString()
    const newSuite: TestSuite = {
      ...suiteData,
      id: uuidv4(),
      createdAt: now,
      updatedAt: now,
    }
    set((state) => ({ suites: [...state.suites, newSuite] }))
  },

  updateSuite: (id, suiteData) => {
    const now = new Date().toLocaleString()
    set((state) => ({
      suites: state.suites.map((s) =>
        s.id === id ? { ...s, ...suiteData, updatedAt: now } : s
      ),
    }))
  },

  deleteSuite: (id) => {
    set((state) => ({
      suites: state.suites.filter((s) => s.id !== id),
    }))
  },

  reorderSuiteCases: (suiteId, caseIds) => {
    const now = new Date().toLocaleString()
    set((state) => ({
      suites: state.suites.map((s) =>
        s.id === suiteId ? { ...s, caseIds, updatedAt: now } : s
      ),
    }))
  },

  updateDevice: (id, deviceData) => {
    set((state) => ({
      devices: state.devices.map((d) =>
        d.id === id ? { ...d, ...deviceData } : d
      ),
    }))
  },

  addDevice: (device) => {
    const newDevice: Device = {
      ...device,
      id: uuidv4(),
    }
    set((state) => ({ devices: [...state.devices, newDevice] }))
  },

  deleteDevice: (id) => {
    set((state) => ({
      devices: state.devices.filter((d) => d.id !== id),
    }))
  },

  addExecution: (execution) => {
    const id = uuidv4()
    const newExecution: ExecutionRecord = {
      ...execution,
      id,
      logs: [],
      results: [],
    }
    set((state) => ({
      executions: [newExecution, ...state.executions],
      currentExecutionId: id,
    }))
    return id
  },

  updateExecution: (id, data) => {
    set((state) => ({
      executions: state.executions.map((e) =>
        e.id === id ? { ...e, ...data } : e
      ),
    }))
  },

  addExecutionLog: (executionId, log) => {
    const newLog = { ...log, id: uuidv4() }
    set((state) => ({
      executions: state.executions.map((e) =>
        e.id === executionId ? { ...e, logs: [...e.logs, newLog] } : e
      ),
    }))
  },

  setCurrentExecution: (id) => {
    set({ currentExecutionId: id })
  },

  addDefect: (defect) => {
    const now = new Date().toLocaleString()
    const newDefect: Defect = {
      ...defect,
      id: uuidv4(),
      createdAt: now,
      updatedAt: now,
    }
    set((state) => ({ defects: [...state.defects, newDefect] }))
  },

  updateDefect: (id, data) => {
    const now = new Date().toLocaleString()
    set((state) => ({
      defects: state.defects.map((d) =>
        d.id === id ? { ...d, ...data, updatedAt: now } : d
      ),
    }))
  },

  deleteDefect: (id) => {
    set((state) => ({
      defects: state.defects.filter((d) => d.id !== id),
    }))
  },

  addProject: (name) => {
    const newProject: Project = {
      id: uuidv4(),
      name,
      settings: { ...defaultProjectSettings },
    }
    set((state) => ({ projects: [...state.projects, newProject] }))
  },

  updateProjectSettings: (projectId, settings) => {
    set((state) => ({
      projects: state.projects.map((p) =>
        p.id === projectId
          ? { ...p, settings: { ...p.settings, ...settings } }
          : p
      ),
    }))
  },

  setCurrentProject: (id) => {
    set({ currentProjectId: id })
  },

  setSelectedTags: (tags) => {
    set({ selectedTags: tags })
  },

  setSearchKeyword: (keyword) => {
    set({ searchKeyword: keyword })
  },

  getAllTags: () => {
    const tags = new Set<string>()
    get().cases.forEach((c) => c.tags.forEach((t) => tags.add(t)))
    return Array.from(tags)
  },

  getFilteredCases: () => {
    const { cases, selectedTags, searchKeyword } = get()
    return cases.filter((c) => {
      const matchKeyword =
        !searchKeyword ||
        c.title.toLowerCase().includes(searchKeyword.toLowerCase()) ||
        c.module.toLowerCase().includes(searchKeyword.toLowerCase())
      const matchTags =
        selectedTags.length === 0 ||
        selectedTags.some((t) => c.tags.includes(t))
      return matchKeyword && matchTags
    })
  },
}))
