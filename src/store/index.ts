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
  CaseResult,
  FailedCaseRank,
  FailureReasonItem,
  ReportRecord,
  ComparisonItem,
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

const REPORT_RECORDS_KEY = 'auto_test_report_records'

const loadReportRecords = (): ReportRecord[] => {
  try {
    const saved = localStorage.getItem(REPORT_RECORDS_KEY)
    if (saved) {
      return JSON.parse(saved)
    }
  } catch (e) {
    console.error('Failed to load report records:', e)
  }
  return []
}

const saveReportRecords = (records: ReportRecord[]) => {
  try {
    localStorage.setItem(REPORT_RECORDS_KEY, JSON.stringify(records))
  } catch (e) {
    console.error('Failed to save report records:', e)
  }
}

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
  addCaseResult: (executionId: string, result: CaseResult) => void
  updateCaseResult: (executionId: string, caseId: string, data: Partial<CaseResult>) => void
  setCurrentExecution: (id: string | null) => void

  addDefect: (defect: Omit<Defect, 'id' | 'createdAt' | 'updatedAt'>) => void
  updateDefect: (id: string, data: Partial<Defect>) => void
  deleteDefect: (id: string) => void
  associateCaseToDefect: (defectId: string, caseId: string) => void
  removeCaseFromDefect: (defectId: string, caseId: string) => void

  addProject: (name: string) => void
  updateProjectSettings: (projectId: string, settings: Partial<ProjectSettings>) => void
  setCurrentProject: (id: string) => void
  deleteProject: (id: string) => void

  reportRecords: ReportRecord[]
  addReportRecord: (record: Omit<ReportRecord, 'id' | 'createdAt'>) => ReportRecord
  deleteReportRecord: (id: string) => void

  setSelectedTags: (tags: string[]) => void
  setSearchKeyword: (keyword: string) => void
  getAllTags: () => string[]

  getFilteredCases: () => TestCase[]
  getFailedCaseRanking: (executionIds?: string[]) => FailedCaseRank[]
  getFailureReasons: (executionIds?: string[]) => FailureReasonItem[]
  compareExecutions: (baseId: string, targetId: string) => ComparisonItem[]
  generateDailyReport: (date: string) => ReportRecord
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

  addCaseResult: (executionId, result) => {
    set((state) => ({
      executions: state.executions.map((e) =>
        e.id === executionId ? { ...e, results: [...e.results, result] } : e
      ),
    }))
  },

  updateCaseResult: (executionId, caseId, data) => {
    set((state) => ({
      executions: state.executions.map((e) =>
        e.id === executionId
          ? {
              ...e,
              results: e.results.map((r) =>
                r.caseId === caseId ? { ...r, ...data } : r
              ),
            }
          : e
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

  associateCaseToDefect: (defectId, caseId) => {
    const now = new Date().toLocaleString()
    set((state) => ({
      defects: state.defects.map((d) =>
        d.id === defectId
          ? {
              ...d,
              caseIds: d.caseIds.includes(caseId) ? d.caseIds : [...d.caseIds, caseId],
              updatedAt: now,
            }
          : d
      ),
    }))
  },

  removeCaseFromDefect: (defectId, caseId) => {
    const now = new Date().toLocaleString()
    set((state) => ({
      defects: state.defects.map((d) =>
        d.id === defectId
          ? {
              ...d,
              caseIds: d.caseIds.filter((cid) => cid !== caseId),
              updatedAt: now,
            }
          : d
      ),
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

  deleteProject: (id) => {
    set((state) => ({ projects: state.projects.filter((p) => p.id !== id) }))
  },

  reportRecords: loadReportRecords(),

  addReportRecord: (record) => {
    const newRecord: ReportRecord = {
      ...record,
      id: uuidv4(),
      createdAt: new Date().toLocaleString(),
    }
    const newRecords = [newRecord, ...get().reportRecords]
    saveReportRecords(newRecords)
    set({ reportRecords: newRecords })
    return newRecord
  },

  deleteReportRecord: (id) => {
    const newRecords = get().reportRecords.filter((r) => r.id !== id)
    saveReportRecords(newRecords)
    set({ reportRecords: newRecords })
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

  getFailedCaseRanking: (executionIds) => {
    const { executions, cases } = get()
    const targetExecutions = executionIds
      ? executions.filter((e) => executionIds.includes(e.id))
      : executions

    const caseFailMap = new Map<string, { failCount: number; totalCount: number; title: string; module: string }>()

    targetExecutions.forEach((exec) => {
      exec.results.forEach((result) => {
        const caseData = cases.find((c) => c.id === result.caseId)
        if (!caseData) return

        const existing = caseFailMap.get(result.caseId)
        if (existing) {
          existing.totalCount++
          if (result.status === 'failed') existing.failCount++
        } else {
          caseFailMap.set(result.caseId, {
            failCount: result.status === 'failed' ? 1 : 0,
            totalCount: 1,
            title: caseData.title,
            module: caseData.module,
          })
        }
      })
    })

    const ranking: FailedCaseRank[] = []
    caseFailMap.forEach((value, key) => {
      if (value.failCount > 0) {
        ranking.push({
          caseId: key,
          caseTitle: value.title,
          module: value.module,
          failCount: value.failCount,
          totalCount: value.totalCount,
          failRate: Math.round((value.failCount / value.totalCount) * 100),
        })
      }
    })

    return ranking.sort((a, b) => b.failCount - a.failCount)
  },

  getFailureReasons: (executionIds) => {
    const { executions } = get()
    const targetExecutions = executionIds
      ? executions.filter((e) => executionIds.includes(e.id))
      : executions

    const reasonMap = new Map<string, number>()

    targetExecutions.forEach((exec) => {
      exec.results.forEach((result) => {
        if (result.status === 'failed' && result.errorMessage) {
          let reason = result.errorMessage
          if (reason.includes('超时') || reason.includes('timeout')) reason = '超时等待'
          else if (reason.includes('未找到') || reason.includes('not found')) reason = '元素未找到'
          else if (reason.includes('断言') || reason.includes('assert')) reason = '断言失败'
          else if (reason.includes('网络') || reason.includes('network')) reason = '网络异常'
          else reason = '其他错误'

          const count = reasonMap.get(reason) || 0
          reasonMap.set(reason, count + 1)
        }
      })
    })

    const reasons: FailureReasonItem[] = []
    reasonMap.forEach((count, reason) => {
      reasons.push({ reason, count })
    })

    return reasons.sort((a, b) => b.count - a.count)
  },

  compareExecutions: (baseId, targetId) => {
    const { executions, defects } = get()
    const base = executions.find((e) => e.id === baseId)
    const target = executions.find((e) => e.id === targetId)
    if (!base || !target) return []

    const results: ComparisonItem[] = []

    target.results.forEach((targetResult) => {
      const baseResult = base.results.find((r) => r.caseId === targetResult.caseId)
      if (!baseResult) return

      const baseDuration = baseResult.stepResults.reduce(
        (sum, s) => sum + (s.duration || 0),
        0
      )
      const targetDuration = targetResult.stepResults.reduce(
        (sum, s) => sum + (s.duration || 0),
        0
      )

      let changeType: ComparisonItem['changeType'] = 'unchanged'
      if (baseResult.status === 'passed' && targetResult.status === 'failed') {
        changeType = 'passed_to_failed'
      } else if (baseResult.status === 'failed' && targetResult.status === 'passed') {
        changeType = 'failed_to_passed'
      } else if (targetDuration > baseDuration * 1.5 && baseDuration > 1000) {
        changeType = 'slower'
      } else if (targetDuration < baseDuration * 0.5 && baseDuration > 1000) {
        changeType = 'faster'
      }

      const caseDefects = defects
        .filter((d) => d.caseIds.includes(targetResult.caseId))
        .map((d) => ({
          id: d.id,
          defectId: d.defectId,
          status: d.status,
          title: d.title,
        }))

      results.push({
        caseId: targetResult.caseId,
        caseTitle: targetResult.caseTitle,
        baseStatus: baseResult.status,
        targetStatus: targetResult.status,
        baseDuration,
        targetDuration,
        changeType,
        defects: caseDefects.length > 0 ? caseDefects : undefined,
      })
    })

    return results
  },

  generateDailyReport: (date) => {
    const { executions, defects, addReportRecord } = get()
    const dayExecutions = executions.filter((e) => e.startTime.startsWith(date))

    const totalCases = dayExecutions.reduce((sum, e) => sum + e.totalCases, 0)
    const totalPassed = dayExecutions.reduce((sum, e) => sum + e.passedCases, 0)
    const totalFailed = dayExecutions.reduce((sum, e) => sum + e.failedCases, 0)
    const passRate = totalCases > 0 ? Math.round((totalPassed / totalCases) * 100) : 0

    const failedCaseSet = new Set<string>()
    dayExecutions.forEach((e) => {
      e.results.forEach((r) => {
        if (r.status === 'failed') failedCaseSet.add(r.caseId)
      })
    })

    const newDefects = defects.filter(
      (d) => d.createdAt.startsWith(date) || d.updatedAt.startsWith(date)
    ).length

    const record = addReportRecord({
      type: 'daily',
      title: `${date} 测试日报`,
      summary: {
        totalExecutions: dayExecutions.length,
        totalCases,
        passRate,
        failedCases: failedCaseSet.size,
      },
      filters: { date },
    })

    return record
  },
}))
