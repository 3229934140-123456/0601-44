import { v4 as uuidv4 } from 'uuid'
import type {
  TestCase,
  TestSuite,
  Device,
  ExecutionRecord,
  Defect,
  Project,
  ProjectSettings,
  TestStep,
  CaseResult,
  ExecutionLog,
} from '@/types'

export const mockSteps: TestStep[] = [
  {
    id: 's1',
    order: 1,
    action: '打开浏览器，访问登录页面',
    expected: '登录页面正常显示',
  },
  {
    id: 's2',
    order: 2,
    action: '输入正确的用户名和密码',
    expected: '用户名密码输入成功',
  },
  {
    id: 's3',
    order: 3,
    action: '点击登录按钮',
    expected: '成功跳转到首页',
  },
]

const caseStepMap: Record<string, TestStep[]> = {
  c1: [
    { id: 'c1-s1', order: 1, action: '打开登录页面', expected: '页面加载完成，显示登录表单' },
    { id: 'c1-s2', order: 2, action: '输入用户名 testuser', expected: '用户名输入框显示 testuser' },
    { id: 'c1-s3', order: 3, action: '输入密码 123456', expected: '密码输入框显示掩码' },
    { id: 'c1-s4', order: 4, action: '点击登录按钮', expected: '成功跳转到首页，显示用户昵称' },
  ],
  c2: [
    { id: 'c2-s1', order: 1, action: '打开注册页面', expected: '注册页面正常显示' },
    { id: 'c2-s2', order: 2, action: '填写用户名、邮箱、手机号', expected: '表单填写完成' },
    { id: 'c2-s3', order: 3, action: '获取验证码', expected: '验证码发送成功' },
    { id: 'c2-s4', order: 4, action: '输入验证码并提交', expected: '注册成功，自动登录' },
  ],
  c3: [
    { id: 'c3-s1', order: 1, action: '在搜索框输入关键词"手机"', expected: '搜索框显示"手机"' },
    { id: 'c3-s2', order: 2, action: '点击搜索按钮', expected: '搜索结果页面加载完成' },
    { id: 'c3-s3', order: 3, action: '验证搜索结果列表', expected: '列表项包含"手机"关键字，结果数大于0' },
    { id: 'c3-s4', order: 4, action: '点击第一个搜索结果', expected: '成功进入商品详情页' },
  ],
  c4: [
    { id: 'c4-s1', order: 1, action: '进入商品详情页', expected: '商品信息正常展示' },
    { id: 'c4-s2', order: 2, action: '选择商品规格', expected: '规格选择完成，价格正确更新' },
    { id: 'c4-s3', order: 3, action: '点击加入购物车按钮', expected: '提示"加入购物车成功"' },
    { id: 'c4-s4', order: 4, action: '查看购物车', expected: '购物车中显示已添加的商品' },
  ],
  c5: [
    { id: 'c5-s1', order: 1, action: '确认购物车商品', expected: '商品列表和金额显示正确' },
    { id: 'c5-s2', order: 2, action: '选择收货地址', expected: '地址选择完成' },
    { id: 'c5-s3', order: 3, action: '选择支付方式并提交订单', expected: '订单创建成功，跳转到支付页' },
    { id: 'c5-s4', order: 4, action: '完成支付', expected: '支付成功，显示订单详情' },
  ],
  c6: [
    { id: 'c6-s1', order: 1, action: '打开登录页面，点击"忘记密码"', expected: '跳转到密码找回页面' },
    { id: 'c6-s2', order: 2, action: '输入注册邮箱', expected: '邮箱输入成功' },
    { id: 'c6-s3', order: 3, action: '点击发送验证码', expected: '提示验证码已发送' },
    { id: 'c6-s4', order: 4, action: '输入新密码并确认', expected: '密码修改成功，可使用新密码登录' },
  ],
}

const failReasons = [
  { reason: '元素未找到', detail: '等待超时，元素未出现在页面中' },
  { reason: '超时等待', detail: '页面加载超过设置的超时时间' },
  { reason: '断言失败', detail: '实际结果与预期不符' },
  { reason: '网络异常', detail: '请求失败，网络连接异常' },
  { reason: '其他错误', detail: '未捕获的脚本执行错误' },
]

export const mockCases: TestCase[] = [
  {
    id: 'c1',
    title: '用户登录功能测试',
    module: '用户模块',
    priority: 'P0',
    preconditions: '1. 系统已部署\n2. 测试账号已创建\n3. 网络连接正常',
    steps: mockSteps,
    tags: ['登录', '认证', '核心功能'],
    createdAt: '2024-01-15 10:30:00',
    updatedAt: '2024-01-20 14:20:00',
    defectIds: ['d1'],
  },
  {
    id: 'c2',
    title: '用户注册功能测试',
    module: '用户模块',
    priority: 'P1',
    preconditions: '1. 系统已部署\n2. 邮箱服务正常',
    steps: [
      { id: 's4', order: 1, action: '访问注册页面', expected: '注册页面显示正常' },
      { id: 's5', order: 2, action: '填写注册信息', expected: '信息填写成功' },
      { id: 's6', order: 3, action: '提交注册', expected: '注册成功，跳转到登录页' },
    ],
    tags: ['注册', '用户模块'],
    createdAt: '2024-01-16 09:00:00',
    updatedAt: '2024-01-18 16:30:00',
  },
  {
    id: 'c3',
    title: '商品搜索功能测试',
    module: '商品模块',
    priority: 'P0',
    preconditions: '1. 商品数据已导入\n2. 搜索服务已启动',
    steps: [
      { id: 's7', order: 1, action: '在搜索框输入关键词', expected: '输入成功' },
      { id: 's8', order: 2, action: '点击搜索按钮', expected: '显示搜索结果列表' },
      { id: 's9', order: 3, action: '验证搜索结果相关性', expected: '结果与关键词匹配' },
    ],
    tags: ['搜索', '商品', '核心功能'],
    createdAt: '2024-01-10 11:00:00',
    updatedAt: '2024-01-22 10:15:00',
    defectIds: ['d2'],
  },
  {
    id: 'c4',
    title: '购物车添加商品测试',
    module: '订单模块',
    priority: 'P1',
    preconditions: '1. 用户已登录\n2. 商品库存充足',
    steps: [
      { id: 's10', order: 1, action: '进入商品详情页', expected: '详情页正常显示' },
      { id: 's11', order: 2, action: '点击加入购物车', expected: '加入成功，数量增加' },
      { id: 's12', order: 3, action: '查看购物车', expected: '商品已在购物车中' },
    ],
    tags: ['购物车', '订单'],
    createdAt: '2024-01-12 14:00:00',
    updatedAt: '2024-01-19 09:30:00',
  },
  {
    id: 'c5',
    title: '支付流程测试',
    module: '支付模块',
    priority: 'P0',
    preconditions: '1. 用户已登录\n2. 购物车有商品\n3. 支付渠道可用',
    steps: [
      { id: 's13', order: 1, action: '进入结算页面', expected: '结算页显示正常' },
      { id: 's14', order: 2, action: '选择支付方式', expected: '支付方式选择成功' },
      { id: 's15', order: 3, action: '确认支付', expected: '支付成功，订单状态更新' },
    ],
    tags: ['支付', '核心功能'],
    createdAt: '2024-01-08 16:00:00',
    updatedAt: '2024-01-21 11:00:00',
  },
  {
    id: 'c6',
    title: '用户个人信息修改测试',
    module: '用户模块',
    priority: 'P2',
    preconditions: '用户已登录',
    steps: [
      { id: 's16', order: 1, action: '进入个人中心', expected: '个人中心页面显示' },
      { id: 's17', order: 2, action: '修改个人信息', expected: '信息修改成功' },
    ],
    tags: ['个人中心', '用户模块'],
    createdAt: '2024-01-20 10:00:00',
    updatedAt: '2024-01-20 10:00:00',
  },
]

export const mockSuites: TestSuite[] = [
  {
    id: 'suite1',
    projectId: 'proj1',
    name: '冒烟测试套件',
    description: '版本发布前的核心功能冒烟测试',
    caseIds: ['c1', 'c3', 'c5'],
    createdAt: '2024-01-15 10:00:00',
    updatedAt: '2024-01-20 14:00:00',
  },
  {
    id: 'suite2',
    projectId: 'proj1',
    name: '回归测试套件',
    description: '完整的回归测试用例集合',
    caseIds: ['c1', 'c2', 'c3', 'c4', 'c5'],
    createdAt: '2024-01-10 09:00:00',
    updatedAt: '2024-01-22 16:00:00',
  },
  {
    id: 'suite3',
    projectId: 'proj2',
    name: '用户模块专项测试',
    description: '用户相关功能的专项测试',
    caseIds: ['c1', 'c2', 'c6'],
    createdAt: '2024-01-18 11:00:00',
    updatedAt: '2024-01-20 10:00:00',
  },
]

export const mockDevices: Device[] = [
  {
    id: 'dev1',
    name: 'Chrome - Windows',
    type: 'browser',
    platform: 'Windows',
    version: '120.0',
    status: 'idle',
    browserName: 'Chrome',
    os: 'Windows 11',
  },
  {
    id: 'dev2',
    name: 'Firefox - Windows',
    type: 'browser',
    platform: 'Windows',
    version: '121.0',
    status: 'idle',
    browserName: 'Firefox',
    os: 'Windows 11',
  },
  {
    id: 'dev3',
    name: 'Safari - macOS',
    type: 'browser',
    platform: 'macOS',
    version: '17.2',
    status: 'running',
    browserName: 'Safari',
    os: 'macOS Sonoma',
  },
  {
    id: 'dev4',
    name: 'iPhone 15',
    type: 'mobile',
    platform: 'iOS',
    version: '17.0',
    status: 'idle',
    os: 'iOS 17',
    ip: '192.168.1.101',
  },
  {
    id: 'dev5',
    name: '小米 14',
    type: 'mobile',
    platform: 'Android',
    version: '14.0',
    status: 'offline',
    os: 'Android 14',
    ip: '192.168.1.102',
  },
  {
    id: 'dev6',
    name: 'Edge - Windows',
    type: 'browser',
    platform: 'Windows',
    version: '120.0',
    status: 'idle',
    browserName: 'Edge',
    os: 'Windows 11',
  },
]

export const mockDefects: Defect[] = [
  {
    id: 'def1',
    defectId: 'BUG-2024001',
    title: '登录页面在Safari浏览器下样式错乱',
    status: 'open',
    severity: 'major',
    caseIds: ['c1'],
    createdAt: '2024-01-20 10:30:00',
    updatedAt: '2024-01-21 09:00:00',
    url: 'http://jira.example.com/BUG-2024001',
  },
  {
    id: 'def2',
    defectId: 'BUG-2024002',
    title: '搜索结果排序不准确',
    status: 'fixed',
    severity: 'minor',
    caseIds: ['c3'],
    createdAt: '2024-01-18 14:00:00',
    updatedAt: '2024-01-22 11:30:00',
    url: 'http://jira.example.com/BUG-2024002',
  },
  {
    id: 'def3',
    defectId: 'BUG-2024003',
    title: '支付超时后订单状态异常',
    status: 'open',
    severity: 'critical',
    caseIds: ['c5'],
    createdAt: '2024-01-22 16:00:00',
    updatedAt: '2024-01-22 16:00:00',
    url: 'http://jira.example.com/BUG-2024003',
  },
]

const generateCaseResult = (
  caseId: string,
  caseTitle: string,
  status?: 'passed' | 'failed' | 'skipped'
): CaseResult => {
  const finalStatus = status || (Math.random() > 0.3 ? 'passed' : 'failed')
  const steps = caseStepMap[caseId] || mockSteps
  const failReason = failReasons[Math.floor(Math.random() * failReasons.length)]

  let failedStepIndex = -1
  if (finalStatus === 'failed') {
    failedStepIndex = Math.floor(Math.random() * steps.length)
  }

  const stepResults: TestStep[] = steps.map((step, idx) => ({
    ...step,
    status:
      finalStatus === 'skipped'
        ? 'skipped'
        : finalStatus === 'passed'
        ? 'passed'
        : idx === failedStepIndex
        ? 'failed'
        : idx < failedStepIndex
        ? 'passed'
        : 'skipped',
    duration: Math.floor(Math.random() * 3000) + 500,
    errorMessage: idx === failedStepIndex && finalStatus === 'failed' ? failReason.detail : undefined,
  }))

  return {
    caseId,
    caseTitle,
    status: finalStatus,
    startTime: new Date(Date.now() - Math.random() * 300000).toISOString(),
    endTime: finalStatus === 'skipped' ? undefined : new Date().toISOString(),
    stepResults,
    errorMessage:
      finalStatus === 'failed'
        ? failReason.detail
        : finalStatus === 'skipped'
        ? '跳过执行'
        : undefined,
  }
}

export const mockExecutions: ExecutionRecord[] = [
  {
    id: 'exec1',
    projectId: 'proj1',
    suiteId: 'suite1',
    suiteName: '冒烟测试套件',
    deviceId: 'dev1',
    deviceName: 'Chrome - Windows',
    startTime: '2024-01-22 09:00:00',
    endTime: '2024-01-22 09:15:30',
    status: 'passed',
    totalCases: 3,
    passedCases: 3,
    failedCases: 0,
    skippedCases: 0,
    passRate: 100,
    logs: [
      { id: 'l1', timestamp: '09:00:00', level: 'info', message: '测试执行开始' },
      { id: 'l2', timestamp: '09:00:05', level: 'info', message: '初始化 Chrome 浏览器' },
      { id: 'l3', timestamp: '09:05:10', level: 'success', message: '用户登录功能测试 - 通过' },
      { id: 'l4', timestamp: '09:10:20', level: 'success', message: '商品搜索功能测试 - 通过' },
      { id: 'l5', timestamp: '09:15:30', level: 'success', message: '支付流程测试 - 通过' },
      { id: 'l6', timestamp: '09:15:30', level: 'info', message: '测试执行完成，通过率: 100%' },
    ],
    results: [
      generateCaseResult('c1', '用户登录功能测试', 'passed'),
      generateCaseResult('c3', '商品搜索功能测试', 'passed'),
      generateCaseResult('c5', '支付流程测试', 'passed'),
    ],
  },
  {
    id: 'exec2',
    projectId: 'proj1',
    suiteId: 'suite2',
    suiteName: '回归测试套件',
    deviceId: 'dev2',
    deviceName: 'Firefox - Windows',
    startTime: '2024-01-21 14:00:00',
    endTime: '2024-01-21 14:45:20',
    status: 'failed',
    totalCases: 5,
    passedCases: 4,
    failedCases: 1,
    skippedCases: 0,
    passRate: 80,
    logs: [
      { id: 'l1', timestamp: '14:00:00', level: 'info', message: '测试执行开始' },
      { id: 'l2', timestamp: '14:00:05', level: 'info', message: '初始化 Firefox 浏览器' },
      { id: 'l3', timestamp: '14:08:10', level: 'success', message: '用户登录功能测试 - 通过' },
      { id: 'l4', timestamp: '14:15:20', level: 'success', message: '用户注册功能测试 - 通过' },
      { id: 'l5', timestamp: '14:25:30', level: 'error', message: '商品搜索功能测试 - 失败' },
      { id: 'l6', timestamp: '14:35:40', level: 'success', message: '购物车添加商品测试 - 通过' },
      { id: 'l7', timestamp: '14:45:20', level: 'success', message: '支付流程测试 - 通过' },
      { id: 'l8', timestamp: '14:45:20', level: 'warn', message: '测试执行完成，通过率: 80%' },
    ],
    results: [
      generateCaseResult('c1', '用户登录功能测试', 'passed'),
      generateCaseResult('c2', '用户注册功能测试', 'passed'),
      generateCaseResult('c3', '商品搜索功能测试', 'failed'),
      generateCaseResult('c4', '购物车添加商品测试', 'passed'),
      generateCaseResult('c5', '支付流程测试', 'passed'),
    ],
  },
  {
    id: 'exec3',
    projectId: 'proj1',
    suiteId: 'suite1',
    suiteName: '冒烟测试套件',
    deviceId: 'dev3',
    deviceName: 'Safari - macOS',
    startTime: '2024-01-20 10:00:00',
    endTime: '2024-01-20 10:12:45',
    status: 'passed',
    totalCases: 3,
    passedCases: 2,
    failedCases: 0,
    skippedCases: 1,
    passRate: 100,
    logs: [],
    results: [
      generateCaseResult('c1', '用户登录功能测试', 'passed'),
      generateCaseResult('c3', '商品搜索功能测试', 'skipped'),
      generateCaseResult('c5', '支付流程测试', 'passed'),
    ],
  },
  {
    id: 'exec4',
    projectId: 'proj2',
    suiteId: 'suite3',
    suiteName: '用户模块专项测试',
    deviceId: 'dev1',
    deviceName: 'Chrome - Windows',
    startTime: '2024-01-19 16:00:00',
    endTime: '2024-01-19 16:30:00',
    status: 'passed',
    totalCases: 3,
    passedCases: 3,
    failedCases: 0,
    skippedCases: 0,
    passRate: 100,
    logs: [],
    results: [
      generateCaseResult('c1', '用户登录功能测试', 'passed'),
      generateCaseResult('c2', '用户注册功能测试', 'passed'),
      generateCaseResult('c6', '密码找回功能测试', 'passed'),
    ],
  },
  {
    id: 'exec5',
    projectId: 'proj1',
    suiteId: 'suite2',
    suiteName: '回归测试套件',
    deviceId: 'dev1',
    deviceName: 'Chrome - Windows',
    startTime: '2024-01-18 09:00:00',
    endTime: '2024-01-18 09:50:00',
    status: 'failed',
    totalCases: 5,
    passedCases: 3,
    failedCases: 2,
    skippedCases: 0,
    passRate: 60,
    logs: [],
    results: [
      generateCaseResult('c1', '用户登录功能测试', 'failed'),
      generateCaseResult('c2', '用户注册功能测试', 'passed'),
      generateCaseResult('c3', '商品搜索功能测试', 'failed'),
      generateCaseResult('c4', '购物车添加商品测试', 'passed'),
      generateCaseResult('c5', '支付流程测试', 'passed'),
    ],
  },
]

export const defaultProjectSettings: ProjectSettings = {
  baseUrl: 'http://localhost:3000',
  defaultBrowser: 'Chrome',
  defaultDevice: 'dev1',
  timeout: 30000,
  retryCount: 1,
  screenshotOnFailure: true,
  reportPath: './reports',
  scheduleEnabled: false,
  scheduleTime: '09:00',
  schedulePeriod: 'daily',
  scheduleSuiteIds: [],
}

export const mockProjects: Project[] = [
  {
    id: 'proj1',
    name: '电商平台测试项目',
    settings: {
      ...defaultProjectSettings,
      baseUrl: 'http://shop.example.com',
      scheduleEnabled: true,
      scheduleTime: '21:00',
      schedulePeriod: 'daily',
      scheduleSuiteIds: ['suite1', 'suite2'],
    },
  },
  {
    id: 'proj2',
    name: 'OA系统测试项目',
    settings: {
      ...defaultProjectSettings,
      baseUrl: 'http://oa.example.com',
      timeout: 60000,
      scheduleEnabled: false,
      scheduleTime: '08:30',
      schedulePeriod: 'weekly',
      scheduleSuiteIds: ['suite3'],
    },
  },
]
