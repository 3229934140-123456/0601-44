import { useState, useEffect, useRef } from 'react'
import {
  Card,
  Row,
  Col,
  Select,
  Button,
  Space,
  Progress,
  Tag,
  Table,
  Modal,
  message,
  Typography,
  Divider,
  List,
  Badge,
  Empty,
  Collapse,
} from 'antd'
import {
  PlayCircleOutlined,
  ReloadOutlined,
  StopOutlined,
  PictureOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  DownOutlined,
  RightOutlined,
} from '@ant-design/icons'
import { useAppStore } from '@/store'
import type { ExecutionRecord, TestStep, CaseResult } from '@/types'
import { v4 as uuidv4 } from 'uuid'

const { Title, Text } = Typography
const { Option } = Select
const { Panel } = Collapse

function ExecutionControl() {
  const {
    suites,
    devices,
    executions,
    currentExecutionId,
    addExecution,
    updateExecution,
    addExecutionLog,
    addCaseResult,
    updateCaseResult,
    setCurrentExecution,
    getCaseById,
  } = useAppStore()

  const [selectedSuiteId, setSelectedSuiteId] = useState<string>(
    suites.length > 0 ? suites[0].id : ''
  )
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>(
    devices.length > 0 ? devices[0].id : ''
  )
  const [isRunning, setIsRunning] = useState(false)
  const [currentCaseIndex, setCurrentCaseIndex] = useState(0)
  const [detailModalVisible, setDetailModalVisible] = useState(false)
  const [expandedCases, setExpandedCases] = useState<string[]>([])

  const logRef = useRef<HTMLDivElement>(null)
  const timersRef = useRef<NodeJS.Timeout[]>([])

  const currentExecution = executions.find((e) => e.id === currentExecutionId)
  const selectedSuite = suites.find((s) => s.id === selectedSuiteId)

  useEffect(() => {
    if (logRef.current && currentExecution?.logs) {
      logRef.current.scrollTop = logRef.current.scrollHeight
    }
  }, [currentExecution?.logs?.length])

  const clearAllTimers = () => {
    timersRef.current.forEach((t) => clearTimeout(t))
    timersRef.current = []
  }

  const addTimer = (timer: NodeJS.Timeout) => {
    timersRef.current.push(timer)
  }

  const handleStartExecution = () => {
    if (!selectedSuiteId || !selectedDeviceId) {
      message.warning('请选择测试套件和执行设备')
      return
    }

    const suite = suites.find((s) => s.id === selectedSuiteId)
    const device = devices.find((d) => d.id === selectedDeviceId)

    if (!suite || !device) return

    const executionId = addExecution({
      projectId: suite.projectId,
      suiteId: selectedSuiteId,
      suiteName: suite.name,
      deviceId: selectedDeviceId,
      deviceName: device.name,
      startTime: new Date().toLocaleString(),
      status: 'running',
      totalCases: suite.caseIds.length,
      passedCases: 0,
      failedCases: 0,
      skippedCases: 0,
      passRate: 0,
    })

    setIsRunning(true)
    setCurrentCaseIndex(0)
    runExecution(executionId, suite.caseIds)
  }

  const runExecution = (executionId: string, caseIds: string[]) => {
    let caseIndex = 0
    let passedCount = 0
    let failedCount = 0

    const runNextCase = () => {
      if (caseIndex >= caseIds.length) {
        finishExecution(executionId, passedCount, failedCount)
        return
      }

      const caseId = caseIds[caseIndex]
      const caseData = getCaseById(caseId)
      if (!caseData) {
        caseIndex++
        runNextCase()
        return
      }

      setCurrentCaseIndex(caseIndex)
      addExecutionLog(executionId, {
        timestamp: new Date().toLocaleTimeString(),
        level: 'info',
        message: `开始执行: ${caseData.title}`,
      })

      const stepResults: TestStep[] = []
      let stepIndex = 0

      const runNextStep = () => {
        if (stepIndex >= caseData.steps.length) {
          const allPassed = stepResults.every((s) => s.status === 'passed')
          const caseResult: CaseResult = {
            caseId,
            caseTitle: caseData.title,
            status: allPassed ? 'passed' : 'failed',
            startTime: new Date(Date.now() - stepResults.length * 800).toISOString(),
            endTime: new Date().toISOString(),
            stepResults,
            errorMessage: allPassed ? undefined : '存在失败的测试步骤',
          }

          addCaseResult(executionId, caseResult)
          addExecutionLog(executionId, {
            timestamp: new Date().toLocaleTimeString(),
            level: allPassed ? 'success' : 'error',
            message: `${caseData.title} - ${allPassed ? '通过' : '失败'}`,
          })

          if (allPassed) {
            passedCount++
          } else {
            failedCount++
          }

          const total = passedCount + failedCount
          const passRate = total > 0 ? Math.round((passedCount / total) * 100) : 0

          updateExecution(executionId, {
            passedCases: passedCount,
            failedCases: failedCount,
            passRate,
          })

          caseIndex++
          const t = setTimeout(runNextCase, 1000)
          addTimer(t)
          return
        }

        const step = caseData.steps[stepIndex]
        addExecutionLog(executionId, {
          timestamp: new Date().toLocaleTimeString(),
          level: 'info',
          message: `  步骤 ${step.order}: ${step.action}`,
        })

        const stepPassed = Math.random() > 0.15
        const resultStep: TestStep = {
          ...step,
          status: stepPassed ? 'passed' : 'failed',
          duration: Math.floor(Math.random() * 3000) + 500,
          errorMessage: stepPassed ? undefined : '元素定位超时，未找到目标元素',
        }
        stepResults.push(resultStep)

        if (!stepPassed) {
          addExecutionLog(executionId, {
            timestamp: new Date().toLocaleTimeString(),
            level: 'error',
            message: `    ✗ 步骤 ${step.order} 失败: ${resultStep.errorMessage}`,
          })
        }

        stepIndex++
        const t = setTimeout(runNextStep, 800)
        addTimer(t)
      }

      const t = setTimeout(runNextStep, 500)
      addTimer(t)
    }

    const t = setTimeout(runNextCase, 500)
    addTimer(t)
  }

  const finishExecution = (executionId: string, passed: number, failed: number) => {
    const status = failed === 0 ? 'passed' : 'failed'
    const total = passed + failed
    const passRate = total > 0 ? Math.round((passed / total) * 100) : 0

    updateExecution(executionId, {
      endTime: new Date().toLocaleString(),
      status,
      passRate,
      passedCases: passed,
      failedCases: failed,
    })

    addExecutionLog(executionId, {
      timestamp: new Date().toLocaleTimeString(),
      level: status === 'passed' ? 'success' : 'warn',
      message: `测试执行完成，通过 ${passed} 个，失败 ${failed} 个，通过率: ${passRate}%`,
    })

    setIsRunning(false)
    setCurrentCaseIndex(0)
    clearAllTimers()
  }

  const handleStopExecution = () => {
    clearAllTimers()
    if (currentExecutionId) {
      const exec = executions.find((e) => e.id === currentExecutionId)
      updateExecution(currentExecutionId, {
        endTime: new Date().toLocaleString(),
        status: 'cancelled',
      })
      addExecutionLog(currentExecutionId, {
        timestamp: new Date().toLocaleTimeString(),
        level: 'warn',
        message: '测试执行已取消',
      })
    }
    setIsRunning(false)
  }

  const handleViewResult = (record: ExecutionRecord) => {
    setCurrentExecution(record.id)
    setDetailModalVisible(true)
  }

  const handleRerunFailed = (record: ExecutionRecord) => {
    if (isRunning) {
      message.warning('当前有任务正在执行，请先停止')
      return
    }

    const failedResults = record.results.filter((r) => r.status === 'failed')
    if (failedResults.length === 0) {
      message.info('没有失败的用例需要重跑')
      return
    }

    setCurrentExecution(record.id)
    setIsRunning(true)
    setDetailModalVisible(true)

    let rerunPassed = 0
    let rerunFailed = 0
    let index = 0

    const rerunNextCase = () => {
      if (index >= failedResults.length) {
        const newPassed = record.passedCases + rerunPassed
        const newFailed = record.failedCases - rerunPassed
        const total = record.totalCases
        const passRate = total > 0 ? Math.round((newPassed / total) * 100) : 0
        const newStatus: 'passed' | 'failed' = newFailed === 0 ? 'passed' : 'failed'

        updateExecution(record.id, {
          passedCases: newPassed,
          failedCases: newFailed,
          passRate,
          status: newStatus,
          endTime: new Date().toLocaleString(),
        })

        addExecutionLog(record.id, {
          timestamp: new Date().toLocaleTimeString(),
          level: 'success',
          message: `失败用例重跑完成，新增通过 ${rerunPassed} 个，仍失败 ${failedResults.length - rerunPassed} 个`,
        })

        setIsRunning(false)
        message.success('失败用例重跑完成')
        return
      }

      const caseResult = failedResults[index]
      const caseData = getCaseById(caseResult.caseId)
      if (!caseData) {
        index++
        rerunNextCase()
        return
      }

      addExecutionLog(record.id, {
        timestamp: new Date().toLocaleTimeString(),
        level: 'info',
        message: `[重跑] 开始执行: ${caseResult.caseTitle}`,
      })

      const stepResults = [...(caseResult.stepResults || [])]
      let stepIndex = 0

      const rerunNextStep = () => {
        if (stepIndex >= caseData.steps.length) {
          const allPassed = stepResults.every((s) => s.status === 'passed')

          updateCaseResult(record.id, caseResult.caseId, {
            status: allPassed ? 'passed' : 'failed',
            stepResults,
            errorMessage: allPassed ? undefined : '存在失败的测试步骤',
            endTime: new Date().toISOString(),
          })

          addExecutionLog(record.id, {
            timestamp: new Date().toLocaleTimeString(),
            level: allPassed ? 'success' : 'error',
            message: `[重跑] ${caseResult.caseTitle} - ${allPassed ? '通过' : '失败'}`,
          })

          if (allPassed) {
            rerunPassed++
          } else {
            rerunFailed++
          }

          index++
          const t = setTimeout(rerunNextCase, 800)
          addTimer(t)
          return
        }

        const step = caseData.steps[stepIndex]
        const existingStep = stepResults.find((s) => s.order === step.order)

        if (existingStep && existingStep.status === 'passed') {
          stepIndex++
          rerunNextStep()
          return
        }

        addExecutionLog(record.id, {
          timestamp: new Date().toLocaleTimeString(),
          level: 'info',
          message: `  [重跑] 步骤 ${step.order}: ${step.action}`,
        })

        const stepPassed = Math.random() > 0.2
        const idx = stepResults.findIndex((s) => s.order === step.order)
        if (idx >= 0) {
          stepResults[idx] = {
            ...stepResults[idx],
            status: stepPassed ? 'passed' : 'failed',
            errorMessage: stepPassed ? undefined : '元素定位超时，未找到目标元素',
            duration: Math.floor(Math.random() * 3000) + 500,
          }
        }

        if (!stepPassed) {
          addExecutionLog(record.id, {
            timestamp: new Date().toLocaleTimeString(),
            level: 'error',
            message: `    ✗ 步骤 ${step.order} 失败`,
          })
        } else {
          addExecutionLog(record.id, {
            timestamp: new Date().toLocaleTimeString(),
            level: 'success',
            message: `    ✓ 步骤 ${step.order} 通过`,
          })
        }

        stepIndex++
        const t = setTimeout(rerunNextStep, 600)
        addTimer(t)
      }

      const t = setTimeout(rerunNextStep, 500)
      addTimer(t)
    }

    rerunNextCase()
  }

  const handleRerunStep = (record: ExecutionRecord, caseResult: CaseResult, step: TestStep) => {
    if (isRunning) {
      message.warning('当前有任务正在执行')
      return
    }

    setIsRunning(true)
    setDetailModalVisible(true)
    setCurrentExecution(record.id)

    addExecutionLog(record.id, {
      timestamp: new Date().toLocaleTimeString(),
      level: 'info',
      message: `[单步重跑] ${caseResult.caseTitle} - 步骤 ${step.order}: ${step.action}`,
    })

    const t = setTimeout(() => {
      const passed = Math.random() > 0.3

      const updatedSteps = caseResult.stepResults?.map((s) =>
        s.order === step.order
          ? {
              ...s,
              status: (passed ? 'passed' : 'failed') as 'passed' | 'failed',
              errorMessage: passed ? undefined : '重试后仍然失败',
              duration: Math.floor(Math.random() * 3000) + 500,
            }
          : s
      )

      const allPassed = updatedSteps?.every((s) => s.status === 'passed')

      updateCaseResult(record.id, caseResult.caseId, {
        status: (allPassed ? 'passed' : 'failed') as 'passed' | 'failed',
        stepResults: updatedSteps,
        errorMessage: allPassed ? undefined : caseResult.errorMessage,
      })

      const exec = executions.find((e) => e.id === record.id)
      if (exec) {
        let newPassed = exec.passedCases
        let newFailed = exec.failedCases

        if (caseResult.status === 'failed' && allPassed) {
          newPassed++
          newFailed--
        } else if (caseResult.status === 'passed' && !allPassed) {
          newPassed--
          newFailed++
        }

        const total = newPassed + newFailed + exec.skippedCases
        const passRate = total > 0 ? Math.round((newPassed / total) * 100) : 0

        const newStatus: 'passed' | 'failed' = newFailed === 0 ? 'passed' : 'failed'

        updateExecution(record.id, {
          passedCases: newPassed,
          failedCases: newFailed,
          passRate,
          status: newStatus,
          endTime: new Date().toLocaleString(),
        })
      }

      addExecutionLog(record.id, {
        timestamp: new Date().toLocaleTimeString(),
        level: passed ? 'success' : 'error',
        message: `[单步重跑] 步骤 ${step.order} - ${passed ? '通过' : '失败'}`,
      })

      setIsRunning(false)
      message.success(passed ? '步骤重跑通过' : '步骤重跑失败')
    }, 1500)

    addTimer(t)
  }

  const executionProgress = currentExecution
    ? currentExecution.totalCases > 0
      ? Math.round(
          ((currentExecution.passedCases + currentExecution.failedCases) /
            currentExecution.totalCases) *
            100
        )
      : 0
    : 0

  const executionColumns = [
    {
      title: '执行时间',
      dataIndex: 'startTime',
      key: 'startTime',
      width: 160,
    },
    {
      title: '套件名称',
      dataIndex: 'suiteName',
      key: 'suiteName',
      width: 150,
    },
    {
      title: '执行设备',
      dataIndex: 'deviceName',
      key: 'deviceName',
      width: 150,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => {
        const statusMap: Record<string, { color: string; text: string; icon: JSX.Element }> = {
          running: { color: 'processing', text: '执行中', icon: <PlayCircleOutlined spin /> },
          passed: { color: 'success', text: '通过', icon: <CheckCircleOutlined /> },
          failed: { color: 'error', text: '失败', icon: <CloseCircleOutlined /> },
          cancelled: { color: 'default', text: '已取消', icon: <StopOutlined /> },
          pending: { color: 'default', text: '等待中', icon: <ClockCircleOutlined /> },
        }
        const s = statusMap[status] || statusMap.pending
        return (
          <Tag color={s.color} icon={s.icon}>
            {s.text}
          </Tag>
        )
      },
    },
    {
      title: '通过率',
      dataIndex: 'passRate',
      key: 'passRate',
      width: 120,
      render: (rate: number) => (
        <Progress percent={rate} size="small" status={rate >= 80 ? 'success' : rate >= 60 ? 'normal' : 'exception'} />
      ),
    },
    {
      title: '用例数',
      key: 'cases',
      width: 140,
      render: (_: unknown, record: ExecutionRecord) => (
        <span>
          <Text type="success">{record.passedCases}通过</Text> /{' '}
          <Text type="danger">{record.failedCases}失败</Text> / {record.totalCases}
        </span>
      ),
    },
    {
      title: '结束时间',
      dataIndex: 'endTime',
      key: 'endTime',
      width: 160,
      render: (time: string | undefined) => time || '-',
    },
    {
      title: '操作',
      key: 'actions',
      width: 160,
      fixed: 'right' as const,
      render: (_: unknown, record: ExecutionRecord) => (
        <Space size="small">
          <Button type="link" size="small" onClick={() => handleViewResult(record)}>
            详情
          </Button>
          {record.status === 'failed' && (
            <Button
              type="link"
              size="small"
              icon={<ReloadOutlined />}
              onClick={() => handleRerunFailed(record)}
              disabled={isRunning}
            >
              重跑失败
            </Button>
          )}
        </Space>
      ),
    },
  ]

  const toggleCaseExpand = (caseId: string) => {
    setExpandedCases((prev) =>
      prev.includes(caseId) ? prev.filter((id) => id !== caseId) : [...prev, caseId]
    )
  }

  const renderStepItem = (step: TestStep, caseResult: CaseResult) => {
    const execRecord = currentExecution
    const canRerun = step.status === 'failed' && !isRunning && execRecord

    return (
      <div
        key={step.id}
        style={{
          padding: '8px 12px',
          background: step.status === 'failed' ? '#fff1f0' : '#f6ffed',
          borderLeft: `3px solid ${step.status === 'failed' ? '#ff4d4f' : '#52c41a'}`,
          marginBottom: 4,
          borderRadius: 4,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <Text strong>步骤 {step.order}：</Text>
            {step.action}
          </div>
          <Space>
            {step.status === 'passed' && <Tag color="success">通过</Tag>}
            {step.status === 'failed' && <Tag color="error">失败</Tag>}
            {step.duration && <Text type="secondary">{step.duration}ms</Text>}
            {canRerun && execRecord && (
              <Button
                type="primary"
                size="small"
                icon={<ReloadOutlined />}
                onClick={() => handleRerunStep(execRecord, caseResult, step)}
              >
                重跑
              </Button>
            )}
          </Space>
        </div>
        <div style={{ marginTop: 4, paddingLeft: 16 }}>
          <Text type="secondary">预期：{step.expected}</Text>
        </div>
        {step.errorMessage && (
          <div style={{ marginTop: 4, paddingLeft: 16 }}>
            <Text type="danger">错误：{step.errorMessage}</Text>
          </div>
        )}
      </div>
    )
  }

  return (
    <div>
      <div className="page-header">
        <div className="page-title">
          <PlayCircleOutlined style={{ marginRight: 8 }} />
          执行控制
        </div>
      </div>

      <Row gutter={[16, 16]}>
        <Col span={16}>
          <Card size="small" title="执行配置">
            <Row gutter={16}>
              <Col span={8}>
                <div style={{ marginBottom: 8 }}>
                  <Text type="secondary">测试套件</Text>
                </div>
                <Select
                  style={{ width: '100%' }}
                  value={selectedSuiteId}
                  onChange={setSelectedSuiteId}
                  disabled={isRunning}
                >
                  {suites.map((s) => (
                    <Option key={s.id} value={s.id}>
                      {s.name} ({s.caseIds.length}个用例)
                    </Option>
                  ))}
                </Select>
              </Col>
              <Col span={8}>
                <div style={{ marginBottom: 8 }}>
                  <Text type="secondary">执行设备</Text>
                </div>
                <Select
                  style={{ width: '100%' }}
                  value={selectedDeviceId}
                  onChange={setSelectedDeviceId}
                  disabled={isRunning}
                >
                  {devices.map((d) => (
                    <Option key={d.id} value={d.id} disabled={d.status === 'offline'}>
                      {d.name}
                      <Tag
                        color={
                          d.status === 'idle'
                            ? 'green'
                            : d.status === 'running'
                            ? 'blue'
                            : 'red'
                        }
                        style={{ marginLeft: 8 }}
                      >
                        {d.status === 'idle' ? '空闲' : d.status === 'running' ? '运行中' : '离线'}
                      </Tag>
                    </Option>
                  ))}
                </Select>
              </Col>
              <Col span={8}>
                <div style={{ marginBottom: 8 }}>
                  <Text type="secondary">操作</Text>
                </div>
                <Space>
                  {!isRunning ? (
                    <Button
                      type="primary"
                      icon={<PlayCircleOutlined />}
                      onClick={handleStartExecution}
                    >
                      开始执行
                    </Button>
                  ) : (
                    <Button danger icon={<StopOutlined />} onClick={handleStopExecution}>
                      停止执行
                    </Button>
                  )}
                </Space>
              </Col>
            </Row>
          </Card>
        </Col>

        <Col span={8}>
          <Card size="small" title="执行统计">
            <Row gutter={[8, 8]}>
              <Col span={12}>
                <div style={{ padding: 12, textAlign: 'center' }}>
                  <div style={{ fontSize: 24, fontWeight: 600 }}>{executions.length}</div>
                  <div style={{ color: '#8c8c8c', fontSize: 12 }}>总执行次数</div>
                </div>
              </Col>
              <Col span={12}>
                <div style={{ padding: 12, textAlign: 'center' }}>
                  <div style={{ fontSize: 24, fontWeight: 600, color: '#52c41a' }}>
                    {executions.filter((e) => e.status === 'passed').length}
                  </div>
                  <div style={{ color: '#8c8c8c', fontSize: 12 }}>通过次数</div>
                </div>
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>

      {currentExecution && currentExecution.status === 'running' && (
        <Card size="small" style={{ marginTop: 16 }}>
          <div className="execution-progress">
            <Progress
              type="circle"
              size={60}
              percent={executionProgress}
              format={(percent) => `${percent}%`}
            />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>
                正在执行: {currentExecution.suiteName}
              </div>
              <div style={{ color: '#8c8c8c' }}>
                第 {currentCaseIndex + 1} / {currentExecution.totalCases} 个用例
                <span style={{ marginLeft: 16 }}>
                  <Badge status="success" text={`${currentExecution.passedCases} 通过`} />
                  <span style={{ margin: '0 8px' }} />
                  <Badge status="error" text={`${currentExecution.failedCases} 失败`} />
                </span>
              </div>
            </div>
          </div>
        </Card>
      )}

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col span={14}>
          <Card size="small" title="执行日志">
            <div ref={logRef} className="log-panel">
              {currentExecution?.logs && currentExecution.logs.length > 0 ? (
                currentExecution.logs.map((log) => (
                  <div key={log.id}>
                    <span style={{ color: '#666', marginRight: 8 }}>[{log.timestamp}]</span>
                    <span className={`log-${log.level}`}>{log.message}</span>
                  </div>
                ))
              ) : (
                <div style={{ color: '#666' }}>暂无日志，开始执行后将显示执行日志...</div>
              )}
            </div>
          </Card>
        </Col>

        <Col span={10}>
          <Card size="small" title="执行截图">
            <div className="screenshot-placeholder">
              <PictureOutlined style={{ fontSize: 32, marginBottom: 8 }} />
              <span>执行过程中将自动截图</span>
            </div>
            {currentExecution?.status === 'failed' && (
              <div style={{ marginTop: 8, textAlign: 'center' }}>
                <Text type="danger">检测到失败用例，已自动保存失败截图</Text>
              </div>
            )}
          </Card>
        </Col>
      </Row>

      <Card size="small" title="执行历史" style={{ marginTop: 16 }}>
        <Table
          columns={executionColumns}
          dataSource={executions}
          rowKey="id"
          size="small"
          scroll={{ x: 1000 }}
          pagination={{
            pageSize: 5,
            showSizeChanger: true,
          }}
        />
      </Card>

      <Modal
        title="执行详情"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        width={900}
        footer={[
          currentExecution?.status === 'failed' && (
            <Button
              key="rerun"
              type="primary"
              icon={<ReloadOutlined />}
              onClick={() => handleRerunFailed(currentExecution)}
              disabled={isRunning}
            >
              重跑失败用例
            </Button>
          ),
          <Button key="close" onClick={() => setDetailModalVisible(false)}>
            关闭
          </Button>,
        ].filter(Boolean)}
      >
        {currentExecution && (
          <div>
            <Row gutter={16} style={{ marginBottom: 16 }}>
              <Col span={8}>
                <div>
                  <Text type="secondary">套件名称</Text>
                  <div style={{ fontWeight: 500 }}>{currentExecution.suiteName}</div>
                </div>
              </Col>
              <Col span={8}>
                <div>
                  <Text type="secondary">执行设备</Text>
                  <div style={{ fontWeight: 500 }}>{currentExecution.deviceName}</div>
                </div>
              </Col>
              <Col span={8}>
                <div>
                  <Text type="secondary">通过率</Text>
                  <div
                    style={{
                      fontWeight: 600,
                      fontSize: 22,
                      color:
                        currentExecution.passRate >= 80
                          ? '#52c41a'
                          : currentExecution.passRate >= 60
                          ? '#faad14'
                          : '#ff4d4f',
                    }}
                  >
                    {currentExecution.passRate}%
                  </div>
                </div>
              </Col>
            </Row>

            <Row gutter={16} style={{ marginBottom: 16 }}>
              <Col span={12}>
                <Text type="secondary">开始时间：</Text>
                {currentExecution.startTime}
              </Col>
              <Col span={12}>
                <Text type="secondary">结束时间：</Text>
                {currentExecution.endTime || '执行中...'}
              </Col>
            </Row>

            <Divider />

            <Title level={5}>
              用例执行结果（{currentExecution.passedCases}通过 / {currentExecution.failedCases}失败 / {currentExecution.totalCases}）
            </Title>
            {currentExecution.results && currentExecution.results.length > 0 ? (
              <div>
                {currentExecution.results.map((result) => (
                  <div
                    key={result.caseId}
                    style={{
                      marginBottom: 8,
                      border: '1px solid #e8e8e8',
                      borderRadius: 6,
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        padding: '10px 12px',
                        background: result.status === 'passed' ? '#f6ffed' : '#fff1f0',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                      onClick={() => toggleCaseExpand(result.caseId)}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {expandedCases.includes(result.caseId) ? (
                          <DownOutlined style={{ fontSize: 12, color: '#999' }} />
                        ) : (
                          <RightOutlined style={{ fontSize: 12, color: '#999' }} />
                        )}
                        {result.status === 'passed' ? (
                          <CheckCircleOutlined style={{ color: '#52c41a' }} />
                        ) : (
                          <CloseCircleOutlined style={{ color: '#ff4d4f' }} />
                        )}
                        <Text strong>{result.caseTitle}</Text>
                        <Tag color={result.status === 'passed' ? 'success' : 'error'}>
                          {result.status === 'passed' ? '通过' : '失败'}
                        </Tag>
                      </div>
                      <Space>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {result.stepResults?.length || 0} 个步骤
                        </Text>
                        {result.status === 'failed' && (
                          <Button
                            type="primary"
                            size="small"
                            icon={<ReloadOutlined />}
                            disabled={isRunning}
                            onClick={(e) => {
                              e.stopPropagation()
                              handleRerunFailed(currentExecution)
                            }}
                          >
                            重跑用例
                          </Button>
                        )}
                      </Space>
                    </div>
                    {expandedCases.includes(result.caseId) && (
                      <div style={{ padding: 12, background: '#fafafa' }}>
                        {result.stepResults?.map((step) => renderStepItem(step, result))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <Empty description="暂无详细结果" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            )}

            <Divider />

            <Title level={5}>执行日志</Title>
            <div className="log-panel" style={{ maxHeight: 200 }}>
              {currentExecution.logs && currentExecution.logs.length > 0 ? (
                currentExecution.logs.map((log) => (
                  <div key={log.id}>
                    <span style={{ color: '#666', marginRight: 8 }}>[{log.timestamp}]</span>
                    <span className={`log-${log.level}`}>{log.message}</span>
                  </div>
                ))
              ) : (
                <div style={{ color: '#666' }}>暂无日志</div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default ExecutionControl
