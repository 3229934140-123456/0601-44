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
  Tooltip,
  Empty,
} from 'antd'
import {
  PlayCircleOutlined,
  PauseCircleOutlined,
  ReloadOutlined,
  StopOutlined,
  PictureOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  AppstoreOutlined,
} from '@ant-design/icons'
import ReactECharts from 'echarts-for-react'
import { useAppStore } from '@/store'
import type { ExecutionRecord, TestStep, CaseResult } from '@/types'

const { Title, Text } = Typography
const { Option } = Select

function ExecutionControl() {
  const {
    suites,
    devices,
    executions,
    currentExecutionId,
    addExecution,
    updateExecution,
    addExecutionLog,
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
  const [selectedResult, setSelectedResult] = useState<CaseResult | null>(null)
  const [detailModalVisible, setDetailModalVisible] = useState(false)
  const [rerunStepModal, setRerunStepModal] = useState<{
    visible: boolean
    caseResult: CaseResult | null
    step: TestStep | null
  }>({ visible: false, caseResult: null, step: null })

  const logRef = useRef<HTMLDivElement>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const currentExecution = executions.find((e) => e.id === currentExecutionId)
  const idleDevices = devices.filter((d) => d.status === 'idle')
  const selectedSuite = suites.find((s) => s.id === selectedSuiteId)

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight
    }
  }, [currentExecution?.logs])

  const handleStartExecution = () => {
    if (!selectedSuiteId || !selectedDeviceId) {
      message.warning('请选择测试套件和执行设备')
      return
    }

    const suite = suites.find((s) => s.id === selectedSuiteId)
    const device = devices.find((d) => d.id === selectedDeviceId)

    if (!suite || !device) return

    const executionId = addExecution({
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
    simulateExecution(executionId, suite.caseIds)
  }

  const simulateExecution = (executionId: string, caseIds: string[]) => {
    let caseIndex = 0

    const runNextCase = () => {
      if (caseIndex >= caseIds.length) {
        finishExecution(executionId)
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

      let stepIndex = 0
      const runNextStep = () => {
        if (stepIndex >= caseData.steps.length) {
          const passed = Math.random() > 0.2
          addExecutionLog(executionId, {
            timestamp: new Date().toLocaleTimeString(),
            level: passed ? 'success' : 'error',
            message: `${caseData.title} - ${passed ? '通过' : '失败'}`,
          })

          const exec = executions.find((e) => e.id === executionId)
          if (exec) {
            const newPassed = exec.passedCases + (passed ? 1 : 0)
            const newFailed = exec.failedCases + (passed ? 0 : 1)
            const total = newPassed + newFailed + exec.skippedCases
            const passRate = total > 0 ? Math.round((newPassed / total) * 100) : 0

            updateExecution(executionId, {
              passedCases: newPassed,
              failedCases: newFailed,
              passRate,
            })
          }

          caseIndex++
          timerRef.current = setTimeout(runNextCase, 1000)
          return
        }

        const step = caseData.steps[stepIndex]
        addExecutionLog(executionId, {
          timestamp: new Date().toLocaleTimeString(),
          level: 'info',
          message: `  步骤 ${step.order}: ${step.action}`,
        })

        stepIndex++
        timerRef.current = setTimeout(runNextStep, 800)
      }

      runNextStep()
    }

    timerRef.current = setTimeout(runNextCase, 500)
  }

  const finishExecution = (executionId: string) => {
    const exec = executions.find((e) => e.id === executionId)
    if (exec) {
      const status = exec.failedCases === 0 ? 'passed' : 'failed'
      updateExecution(executionId, {
        endTime: new Date().toLocaleString(),
        status,
      })
      addExecutionLog(executionId, {
        timestamp: new Date().toLocaleTimeString(),
        level: status === 'passed' ? 'success' : 'warn',
        message: `测试执行完成，通过率: ${exec.passRate}%`,
      })
    }
    setIsRunning(false)
    setCurrentCaseIndex(0)
  }

  const handleStopExecution = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
    if (currentExecutionId) {
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

  const handleRerunStep = (caseResult: CaseResult, step: TestStep) => {
    setRerunStepModal({ visible: true, caseResult, step })
  }

  const confirmRerunStep = () => {
    message.success('步骤重跑已启动')
    setRerunStepModal({ visible: false, caseResult: null, step: null })
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
      width: 100,
      render: (rate: number) => (
        <span style={{ color: rate >= 80 ? '#52c41a' : rate >= 60 ? '#faad14' : '#ff4d4f' }}>
          {rate}%
        </span>
      ),
    },
    {
      title: '用例数',
      key: 'cases',
      width: 120,
      render: (_: unknown, record: ExecutionRecord) => (
        <span>
          <Text type="success">{record.passedCases}通过</Text> /{' '}
          <Text type="danger">{record.failedCases}失败</Text> / {record.totalCases}
        </span>
      ),
    },
    {
      title: '操作',
      key: 'actions',
      width: 120,
      render: (_: unknown, record: ExecutionRecord) => (
        <Space>
          <Button type="link" size="small" onClick={() => handleViewResult(record)}>
            查看详情
          </Button>
          {record.status === 'failed' && (
            <Button type="link" size="small" icon={<ReloadOutlined />}>
              重跑失败
            </Button>
          )}
        </Space>
      ),
    },
  ]

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
                <div className="report-card" style={{ padding: 12, textAlign: 'center' }}>
                  <div className="report-stat-value" style={{ fontSize: 24 }}>
                    {executions.length}
                  </div>
                  <div className="report-stat-label">总执行次数</div>
                </div>
              </Col>
              <Col span={12}>
                <div className="report-card" style={{ padding: 12, textAlign: 'center' }}>
                  <div
                    className="report-stat-value"
                    style={{
                      fontSize: 24,
                      color: '#52c41a',
                    }}
                  >
                    {executions.filter((e) => e.status === 'passed').length}
                  </div>
                  <div className="report-stat-label">通过次数</div>
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
        footer={null}
        width={900}
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
                      fontSize: 18,
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

            <Divider />

            <Title level={5}>用例执行结果</Title>
            {currentExecution.results && currentExecution.results.length > 0 ? (
              <List
                size="small"
                dataSource={currentExecution.results}
                renderItem={(result) => (
                  <List.Item
                    actions={[
                      <Button
                        key="view"
                        type="link"
                        size="small"
                        onClick={() => setSelectedResult(result)}
                      >
                        查看步骤
                      </Button>,
                      result.status === 'failed' && (
                        <Button
                          key="rerun"
                          type="link"
                          size="small"
                          icon={<ReloadOutlined />}
                        >
                          重跑
                        </Button>
                      ),
                    ].filter(Boolean)}
                  >
                    <List.Item.Meta
                      avatar={
                        result.status === 'passed' ? (
                          <CheckCircleOutlined style={{ color: '#52c41a', fontSize: 20 }} />
                        ) : (
                          <CloseCircleOutlined style={{ color: '#ff4d4f', fontSize: 20 }} />
                        )
                      }
                      title={result.caseTitle}
                      description={
                        result.errorMessage ? (
                          <Text type="danger">{result.errorMessage}</Text>
                        ) : (
                          <Text type="secondary">
                            {result.stepResults?.length || 0} 个步骤
                          </Text>
                        )
                      }
                    />
                  </List.Item>
                )}
              />
            ) : (
              <Empty description="暂无详细结果" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            )}
          </div>
        )}
      </Modal>

      <Modal
        title="重跑失败步骤"
        open={rerunStepModal.visible}
        onOk={confirmRerunStep}
        onCancel={() => setRerunStepModal({ visible: false, caseResult: null, step: null })}
        okText="确认重跑"
        cancelText="取消"
      >
        {rerunStepModal.step && (
          <div>
            <p>
              <Text type="secondary">用例：</Text>
              {rerunStepModal.caseResult?.caseTitle}
            </p>
            <p>
              <Text type="secondary">步骤：</Text>
              步骤 {rerunStepModal.step.order}
            </p>
            <p>
              <Text type="secondary">操作：</Text>
              {rerunStepModal.step.action}
            </p>
            <p>
              <Text type="secondary">预期结果：</Text>
              {rerunStepModal.step.expected}
            </p>
            <Text type="danger">错误信息：{rerunStepModal.step.errorMessage}</Text>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default ExecutionControl
