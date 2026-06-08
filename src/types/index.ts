export interface TestStep {
  id: string
  order: number
  action: string
  expected: string
  status?: 'pending' | 'running' | 'passed' | 'failed' | 'skipped'
  screenshot?: string
  errorMessage?: string
  duration?: number
}

export interface TestCase {
  id: string
  title: string
  module: string
  priority: 'P0' | 'P1' | 'P2' | 'P3'
  preconditions: string
  steps: TestStep[]
  tags: string[]
  createdAt: string
  updatedAt: string
  defectIds?: string[]
}

export interface TestSuite {
  id: string
  name: string
  description: string
  caseIds: string[]
  createdAt: string
  updatedAt: string
}

export interface Device {
  id: string
  name: string
  type: 'browser' | 'mobile' | 'desktop'
  platform: string
  version: string
  status: 'idle' | 'running' | 'offline' | 'busy'
  ip?: string
  browserName?: string
  os?: string
  connectedAt?: string
}

export interface ExecutionRecord {
  id: string
  suiteId: string
  suiteName: string
  deviceId: string
  deviceName: string
  startTime: string
  endTime?: string
  status: 'pending' | 'running' | 'passed' | 'failed' | 'cancelled'
  totalCases: number
  passedCases: number
  failedCases: number
  skippedCases: number
  passRate: number
  logs: ExecutionLog[]
  results: CaseResult[]
}

export interface ExecutionLog {
  id: string
  timestamp: string
  level: 'info' | 'warn' | 'error' | 'success'
  message: string
}

export interface CaseResult {
  caseId: string
  caseTitle: string
  status: 'passed' | 'failed' | 'skipped'
  startTime: string
  endTime?: string
  stepResults: TestStep[]
  errorMessage?: string
  screenshot?: string
}

export interface Defect {
  id: string
  defectId: string
  title: string
  status: 'open' | 'fixed' | 'closed' | 'reopen'
  severity: 'critical' | 'major' | 'minor' | 'trivial'
  caseIds: string[]
  createdAt: string
  updatedAt: string
  url?: string
}

export interface Project {
  id: string
  name: string
  settings: ProjectSettings
}

export interface ProjectSettings {
  baseUrl: string
  defaultBrowser: string
  defaultDevice: string
  timeout: number
  retryCount: number
  screenshotOnFailure: boolean
  reportPath: string
  scheduleEnabled: boolean
  scheduleTime?: string
  scheduleCron?: string
}

export interface DailyReport {
  date: string
  totalExecutions: number
  totalCases: number
  passRate: number
  failedCases: string[]
  newDefects: number
  fixedDefects: number
}
