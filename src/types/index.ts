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
  projectId: string
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
  projectId: string
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
  schedulePeriod?: 'daily' | 'weekly' | 'monthly'
  scheduleSuiteIds?: string[]
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

export interface FailedCaseRank {
  caseId: string
  caseTitle: string
  module: string
  failCount: number
  totalCount: number
  failRate: number
}

export interface FailureReasonItem {
  reason: string
  count: number
}

export interface ReportTrendItem {
  date: string
  passRate: number
  executionCount: number
}

export interface ReportFailedCase {
  caseId: string
  caseTitle: string
  module: string
  failCount: number
  failRate: number
  errorMessage?: string
  defects: { defectId: string; title: string; status: string }[]
}

export interface ReportRecord {
  id: string
  type: 'daily' | 'execution'
  title: string
  createdAt: string
  filters: {
    projectId?: string
    projectName?: string
    suiteId?: string
    suiteName?: string
    deviceId?: string
    deviceName?: string
    startDate?: string
    endDate?: string
  }
  summary: {
    totalExecutions: number
    totalCases: number
    passedCases: number
    failedCases: number
    passRate: number
  }
  trendData: ReportTrendItem[]
  failedCaseRanking: ReportFailedCase[]
  failureReasons: { reason: string; count: number }[]
  relatedDefects: { defectId: string; title: string; status: string; severity: string }[]
}

export interface ComparisonItem {
  caseId: string
  caseTitle: string
  baseStatus: 'passed' | 'failed' | 'skipped'
  targetStatus: 'passed' | 'failed' | 'skipped'
  baseDuration?: number
  targetDuration?: number
  changeType: 'passed_to_failed' | 'failed_to_passed' | 'slower' | 'faster' | 'unchanged'
  defects?: { id: string; defectId: string; status: string; title: string }[]
}
