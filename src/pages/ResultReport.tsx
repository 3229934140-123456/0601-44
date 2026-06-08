import { useState, useEffect, useMemo } from 'react'
import {
  Card,
  Row,
  Col,
  Button,
  Select,
  DatePicker,
  Table,
  Tag,
  Modal,
  message,
  Typography,
  Space,
  List,
  Progress,
  Divider,
  Tabs,
  Tooltip,
  Collapse,
  Empty,
  Popconfirm,
} from 'antd'
import {
  FileTextOutlined,
  DownloadOutlined,
  BarChartOutlined,
  RiseOutlined,
  FallOutlined,
  AppstoreOutlined,
  ExportOutlined,
  RightOutlined,
  LeftOutlined,
  BgColorsOutlined,
  HistoryOutlined,
  DeleteOutlined,
  EyeOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  BugOutlined,
} from '@ant-design/icons'
import ReactECharts from 'echarts-for-react'
import { useAppStore } from '@/store'
import type { ExecutionRecord, CaseResult, ComparisonItem, ReportRecord } from '@/types'
import dayjs from 'dayjs'

const { Title, Text } = Typography
const { Option } = Select
const { RangePicker } = DatePicker
const { Panel } = Collapse
const { TabPane } = Tabs

function ResultReport() {
  const {
    executions,
    suites,
    devices,
    projects,
    reportRecords,
    getFailedCaseRanking,
    getFailureReasons,
    compareExecutions,
    generateDailyReport,
    deleteReportRecord,
    generateReport,
    addReportRecord,
  } = useAppStore()

  const [selectedProject, setSelectedProject] = useState<string>('all')
  const [selectedSuite, setSelectedSuite] = useState<string>('all')
  const [selectedDevice, setSelectedDevice] = useState<string>('all')
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null)

  const [detailModal, setDetailModal] = useState<{ visible: boolean; record: ExecutionRecord | null }>({
    visible: false,
    record: null,
  })
  const [expandedCaseRows, setExpandedCaseRows] = useState<Set<string>>(new Set())

  const [compareModalVisible, setCompareModalVisible] = useState(false)
  const [compareBaseId, setCompareBaseId] = useState<string>('')
  const [compareTargetId, setCompareTargetId] = useState<string>('')

  const [reportHistoryVisible, setReportHistoryVisible] = useState(false)
  const [dailyPreviewVisible, setDailyPreviewVisible] = useState(false)
  const [previewDate, setPreviewDate] = useState<string>('')

  const [reportDetailVisible, setReportDetailVisible] = useState(false)
  const [viewingReport, setViewingReport] = useState<ReportRecord | null>(null)

  useEffect(() => {
    if (selectedProject !== 'all') {
      const projectSuiteIds = suites.filter((s) => s.projectId === selectedProject).map((s) => s.id)
      if (selectedSuite !== 'all' && !projectSuiteIds.includes(selectedSuite)) {
        setSelectedSuite('all')
      }
    }
  }, [selectedProject, suites, selectedSuite])

  const filteredSuites = useMemo(() => {
    if (selectedProject === 'all') return suites
    return suites.filter((s) => s.projectId === selectedProject)
  }, [suites, selectedProject])

  const filteredExecutions = useMemo(() => {
    return executions.filter((e) => {
      if (selectedProject !== 'all' && e.projectId !== selectedProject) return false
      if (selectedSuite !== 'all' && e.suiteId !== selectedSuite) return false
      if (selectedDevice !== 'all' && e.deviceId !== selectedDevice) return false
      if (dateRange && dateRange.length === 2) {
        const execDate = dayjs(e.startTime)
        if (execDate.isBefore(dateRange[0], 'day') || execDate.isAfter(dateRange[1], 'day')) {
          return false
        }
      }
      return true
    })
  }, [executions, selectedProject, selectedSuite, selectedDevice, dateRange])

  const filteredExecutionIds = filteredExecutions.map((e) => e.id)

  const totalExecutions = filteredExecutions.length
  const passedExecutions = filteredExecutions.filter((e) => e.status === 'passed').length
  const failedExecutions = filteredExecutions.filter((e) => e.status === 'failed').length
  const avgPassRate =
    totalExecutions > 0
      ? Math.round(filteredExecutions.reduce((sum, e) => sum + e.passRate, 0) / totalExecutions)
      : 0
  const totalFailedCases = filteredExecutions.reduce((sum, e) => sum + e.failedCases, 0)

  const failedCaseRanking = useMemo(
    () => getFailedCaseRanking(filteredExecutionIds),
    [filteredExecutionIds]
  )

  const failureReasons = useMemo(
    () => getFailureReasons(filteredExecutionIds),
    [filteredExecutionIds]
  )

  const comparisonResults = useMemo(() => {
    if (!compareBaseId || !compareTargetId) return []
    return compareExecutions(compareBaseId, compareTargetId)
  }, [compareBaseId, compareTargetId])

  const trendData = useMemo(() => {
    const days = 7
    const dates: string[] = []
    const passRates: number[] = []
    const execCounts: number[] = []

    for (let i = days - 1; i >= 0; i--) {
      const date = dayjs().subtract(i, 'day')
      const dateStr = date.format('MM-DD')
      dates.push(dateStr)

      const dayExecutions = filteredExecutions.filter((e) =>
        dayjs(e.startTime).isSame(date, 'day')
      )

      execCounts.push(dayExecutions.length)

      if (dayExecutions.length > 0) {
        const avg = Math.round(
          dayExecutions.reduce((sum, e) => sum + e.passRate, 0) / dayExecutions.length
        )
        passRates.push(avg)
      } else {
        passRates.push(0)
      }
    }

    return { dates, passRates, execCounts }
  }, [filteredExecutions])

  const trendChartOption = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'cross' },
    },
    legend: { data: ['通过率', '执行次数'] },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: {
      type: 'category',
      data: trendData.dates,
      boundaryGap: false,
    },
    yAxis: [
      {
        type: 'value',
        name: '通过率',
        max: 100,
        min: 0,
        axisLabel: { formatter: '{value}%' },
      },
      {
        type: 'value',
        name: '执行次数',
        min: 0,
      },
    ],
    series: [
      {
        name: '通过率',
        type: 'line',
        smooth: true,
        data: trendData.passRates,
        yAxisIndex: 0,
        areaStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(22, 119, 255, 0.3)' },
              { offset: 1, color: 'rgba(22, 119, 255, 0.05)' },
            ],
          },
        },
        lineStyle: { color: '#1677ff', width: 2 },
        itemStyle: { color: '#1677ff' },
      },
      {
        name: '执行次数',
        type: 'bar',
        data: trendData.execCounts,
        yAxisIndex: 1,
        barWidth: 20,
        itemStyle: { color: '#91caff' },
      },
    ],
  }

  const failureReasonChartOption = {
    tooltip: { trigger: 'item', formatter: '{b}: {c}次 ({d}%)' },
    legend: { orient: 'vertical', right: 10, top: 'center' },
    series: [
      {
        name: '失败原因',
        type: 'pie',
        radius: ['50%', '70%'],
        center: ['35%', '50%'],
        avoidLabelOverlap: false,
        label: { show: false, position: 'center' },
        emphasis: {
          label: { show: true, fontSize: 18, fontWeight: 'bold' },
        },
        labelLine: { show: false },
        data: failureReasons.map((r, idx) => ({
          value: r.count,
          name: r.reason,
          itemStyle: {
            color: ['#ff4d4f', '#faad14', '#722ed1', '#13c2c2', '#8c8c8c'][idx % 5],
          },
        })),
      },
    ],
  }

  const toggleCaseRow = (caseId: string) => {
    const next = new Set(expandedCaseRows)
    if (next.has(caseId)) {
      next.delete(caseId)
    } else {
      next.add(caseId)
    }
    setExpandedCaseRows(next)
  }

  const handleViewDetail = (record: ExecutionRecord) => {
    setDetailModal({ visible: true, record })
    setExpandedCaseRows(new Set())
  }

  const handleGenerateDaily = () => {
    const today = dayjs().format('YYYY-MM-DD')
    setPreviewDate(today)
    setDailyPreviewVisible(true)
  }

  const handleConfirmGenerateDaily = () => {
    const record = generateDailyReport(previewDate)
    message.success(`日报生成成功：${record.title}`)
    setDailyPreviewVisible(false)
  }

  const handleExportReport = () => {
    const filters: ReportRecord['filters'] = {
      projectId: selectedProject === 'all' ? undefined : selectedProject,
      suiteId: selectedSuite === 'all' ? undefined : selectedSuite,
      deviceId: selectedDevice === 'all' ? undefined : selectedDevice,
      startDate: dateRange?.[0]?.format('YYYY-MM-DD'),
      endDate: dateRange?.[1]?.format('YYYY-MM-DD'),
    }
    const reportData = generateReport(filters)
    const newRecord = addReportRecord(reportData)
    message.success(`报告已生成：${newRecord.title}`)
  }

  const handleCompare = () => {
    if (!compareBaseId || !compareTargetId) {
      message.warning('请选择两次执行记录')
      return
    }
    if (compareBaseId === compareTargetId) {
      message.warning('请选择不同的执行记录进行对比')
      return
    }
    setCompareModalVisible(true)
  }

  const renderStatusTag = (status: string) => {
    const map: Record<string, { color: string; text: string }> = {
      running: { color: 'processing', text: '执行中' },
      passed: { color: 'success', text: '通过' },
      failed: { color: 'error', text: '失败' },
      cancelled: { color: 'default', text: '已取消' },
    }
    const s = map[status] || { color: 'default', text: status }
    return <Tag color={s.color}>{s.text}</Tag>
  }

  const renderStepStatus = (status?: string) => {
    if (status === 'passed') return <CheckCircleOutlined style={{ color: '#52c41a' }} />
    if (status === 'failed') return <CloseCircleOutlined style={{ color: '#ff4d4f' }} />
    if (status === 'running') return <ClockCircleOutlined style={{ color: '#1677ff' }} />
    return <ClockCircleOutlined style={{ color: '#8c8c8c' }} />
  }

  const caseColumns = [
    {
      title: '用例名称',
      dataIndex: 'caseTitle',
      key: 'caseTitle',
      width: 250,
      render: (text: string, record: CaseResult) => (
        <div
          style={{
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
          onClick={() => toggleCaseRow(record.caseId)}
        >
          {expandedCaseRows.has(record.caseId) ? (
            <RightOutlined rotate={90} style={{ fontSize: 12 }} />
          ) : (
            <RightOutlined style={{ fontSize: 12 }} />
          )}
          {text}
        </div>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => renderStatusTag(status),
    },
    {
      title: '耗时',
      dataIndex: 'duration',
      key: 'duration',
      width: 100,
      render: (_: unknown, record: CaseResult) => {
        const total = record.stepResults.reduce((sum, s) => sum + (s.duration || 0), 0)
        return `${(total / 1000).toFixed(2)}s`
      },
    },
    {
      title: '错误信息',
      dataIndex: 'errorMessage',
      key: 'errorMessage',
      ellipsis: true,
      render: (text: string) => text || '-',
    },
  ]

  const expandedCaseRowRender = (record: CaseResult) => (
    <div style={{ padding: '8px 24px', background: '#fafafa', borderRadius: 4 }}>
      <Text type="secondary" style={{ fontSize: 12 }}>
        测试步骤：
      </Text>
      <List
        size="small"
        dataSource={record.stepResults}
        renderItem={(step) => (
          <List.Item style={{ padding: '4px 0', borderBottom: 'none' }}>
            <Space style={{ width: '100%' }}>
              {renderStepStatus(step.status)}
              <Text style={{ fontSize: 13 }}>
                步骤 {step.order}：{step.action}
              </Text>
              <Text type="secondary" style={{ fontSize: 12 }}>
                期望：{step.expected}
              </Text>
              {step.duration !== undefined && (
                <Tag style={{ marginLeft: 'auto' }}>{(step.duration / 1000).toFixed(2)}s</Tag>
              )}
              {step.errorMessage && (
                <Text type="danger" style={{ fontSize: 12 }}>
                  错误：{step.errorMessage}
                </Text>
              )}
            </Space>
          </List.Item>
        )}
      />
    </div>
  )

  const columns = [
    {
      title: '执行时间',
      dataIndex: 'startTime',
      key: 'startTime',
      width: 170,
      sorter: (a: ExecutionRecord, b: ExecutionRecord) =>
        dayjs(a.startTime).valueOf() - dayjs(b.startTime).valueOf(),
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
      width: 90,
      render: (status: string) => renderStatusTag(status),
    },
    {
      title: '通过率',
      dataIndex: 'passRate',
      key: 'passRate',
      width: 140,
      render: (rate: number) => (
        <Progress
          percent={rate}
          size="small"
          status={rate >= 80 ? 'success' : rate >= 60 ? 'normal' : 'exception'}
        />
      ),
    },
    {
      title: '用例统计',
      key: 'stats',
      width: 170,
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
      width: 150,
      render: (_: unknown, record: ExecutionRecord) => (
        <Space>
          <Button type="link" size="small" onClick={() => handleViewDetail(record)}>
            详情
          </Button>
          <Button type="link" size="small" icon={<DownloadOutlined />}>
            导出
          </Button>
        </Space>
      ),
    },
  ]

  const getChangeTypeInfo = (type: ComparisonItem['changeType']) => {
    switch (type) {
      case 'passed_to_failed':
        return { color: 'red', icon: <ArrowDownOutlined />, text: '通过→失败' }
      case 'failed_to_passed':
        return { color: 'green', icon: <ArrowUpOutlined />, text: '失败→通过' }
      case 'slower':
        return { color: 'orange', icon: <ClockCircleOutlined />, text: '耗时变长' }
      case 'faster':
        return { color: 'blue', icon: <ClockCircleOutlined />, text: '耗时变短' }
      default:
        return { color: 'default', icon: null, text: '无变化' }
    }
  }

  const comparisonColumns = [
    {
      title: '用例名称',
      dataIndex: 'caseTitle',
      key: 'caseTitle',
      width: 250,
    },
    {
      title: '变化类型',
      dataIndex: 'changeType',
      key: 'changeType',
      width: 120,
      render: (type: ComparisonItem['changeType']) => {
        const info = getChangeTypeInfo(type)
        return (
          <Tag color={info.color}>
            {info.icon} {info.text}
          </Tag>
        )
      },
    },
    {
      title: '基准状态',
      dataIndex: 'baseStatus',
      key: 'baseStatus',
      width: 100,
      render: (s: string) => renderStatusTag(s),
    },
    {
      title: '对比状态',
      dataIndex: 'targetStatus',
      key: 'targetStatus',
      width: 100,
      render: (s: string) => renderStatusTag(s),
    },
    {
      title: '基准耗时',
      dataIndex: 'baseDuration',
      key: 'baseDuration',
      width: 100,
      render: (d?: number) => (d !== undefined ? `${(d / 1000).toFixed(2)}s` : '-'),
    },
    {
      title: '对比耗时',
      dataIndex: 'targetDuration',
      key: 'targetDuration',
      width: 100,
      render: (d?: number) => (d !== undefined ? `${(d / 1000).toFixed(2)}s` : '-'),
    },
    {
      title: '关联缺陷',
      dataIndex: 'defects',
      key: 'defects',
      render: (defects?: ComparisonItem['defects']) => {
        if (!defects || defects.length === 0) return <Text type="secondary">-</Text>
        return (
          <Space direction="vertical" size={2}>
            {defects.map((d) => (
              <Tag key={d.id} color="red" icon={<BugOutlined />}>
                {d.defectId} ({d.status === 'open' ? '待修复' : d.status === 'fixed' ? '已修复' : d.status})
              </Tag>
            ))}
          </Space>
        )
      },
    },
  ]

  const sameSuiteExecutions = useMemo(() => {
    if (!compareBaseId) return executions
    const baseExec = executions.find((e) => e.id === compareBaseId)
    if (!baseExec) return executions
    return executions.filter((e) => e.suiteId === baseExec.suiteId && e.id !== compareBaseId)
  }, [compareBaseId, executions])

  return (
    <div>
      <div className="page-header">
        <div className="page-title">
          <FileTextOutlined style={{ marginRight: 8 }} />
          结果报告
        </div>
        <Space>
          <Button icon={<HistoryOutlined />} onClick={() => setReportHistoryVisible(true)}>
            报告历史
          </Button>
          <Button icon={<ExportOutlined />} onClick={handleGenerateDaily}>
            生成日报
          </Button>
          <Button type="primary" icon={<DownloadOutlined />} onClick={handleExportReport}>
            导出报告
          </Button>
        </Space>
      </div>

      <Card size="small" style={{ marginBottom: 16 }}>
        <Space wrap>
          <span style={{ fontWeight: 500 }}>筛选条件：</span>

          <Select
            value={selectedProject}
            onChange={setSelectedProject}
            style={{ width: 160 }}
            placeholder="选择项目"
          >
            <Option value="all">全部项目</Option>
            {projects.map((p) => (
              <Option key={p.id} value={p.id}>
                {p.name}
              </Option>
            ))}
          </Select>

          <Select
            value={selectedSuite}
            onChange={setSelectedSuite}
            style={{ width: 180 }}
            placeholder="选择套件"
          >
            <Option value="all">全部套件</Option>
            {filteredSuites.map((s) => (
              <Option key={s.id} value={s.id}>
                {s.name}
              </Option>
            ))}
          </Select>

          <Select
            value={selectedDevice}
            onChange={setSelectedDevice}
            style={{ width: 180 }}
            placeholder="选择设备"
          >
            <Option value="all">全部设备</Option>
            {devices.map((d) => (
              <Option key={d.id} value={d.id}>
                {d.name}
              </Option>
            ))}
          </Select>

          <RangePicker
            value={dateRange}
            onChange={(dates) => setDateRange(dates as [dayjs.Dayjs, dayjs.Dayjs] | null)}
            style={{ width: 260 }}
          />

          <Button
            onClick={() => {
              setSelectedProject('all')
              setSelectedSuite('all')
              setSelectedDevice('all')
              setDateRange(null)
            }}
          >
            重置
          </Button>
        </Space>
      </Card>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <BarChartOutlined style={{ fontSize: 32, color: '#1677ff' }} />
              <div>
                <div style={{ fontSize: 24, fontWeight: 600 }}>{totalExecutions}</div>
                <div style={{ color: '#8c8c8c' }}>总执行次数</div>
              </div>
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <RiseOutlined style={{ fontSize: 32, color: '#52c41a' }} />
              <div>
                <div style={{ fontSize: 24, fontWeight: 600, color: '#52c41a' }}>
                  {passedExecutions}
                </div>
                <div style={{ color: '#8c8c8c' }}>通过次数</div>
              </div>
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <FallOutlined style={{ fontSize: 32, color: '#ff4d4f' }} />
              <div>
                <div
                  style={{
                    fontSize: 24,
                    fontWeight: 600,
                    color: avgPassRate >= 80 ? '#52c41a' : '#faad14',
                  }}
                >
                  {avgPassRate}%
                </div>
                <div style={{ color: '#8c8c8c' }}>平均通过率</div>
              </div>
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <BgColorsOutlined style={{ fontSize: 32, color: '#faad14' }} />
              <div>
                <div style={{ fontSize: 24, fontWeight: 600, color: '#faad14' }}>
                  {totalFailedCases}
                </div>
                <div style={{ color: '#8c8c8c' }}>失败用例次</div>
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col span={16}>
          <Card size="small" title="通过率趋势（近7天）">
            <ReactECharts option={trendChartOption} style={{ height: 280 }} />
          </Card>
        </Col>
        <Col span={8}>
          <Card size="small" title="失败原因分布">
            {failureReasons.length > 0 ? (
              <ReactECharts option={failureReasonChartOption} style={{ height: 280 }} />
            ) : (
              <Empty description="暂无失败数据" style={{ paddingTop: 60 }} />
            )}
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col span={24}>
          <Card size="small" title="失败用例排行 TOP 10">
            {failedCaseRanking.length > 0 ? (
              <List
                size="small"
                dataSource={failedCaseRanking.slice(0, 10)}
                renderItem={(item, index) => (
                  <List.Item style={{ padding: '8px 0' }}>
                    <Space style={{ width: '100%' }} align="center">
                      <Tag
                        color={index < 3 ? 'red' : 'default'}
                        style={{ width: 28, textAlign: 'center', minWidth: 28 }}
                      >
                        {index + 1}
                      </Tag>
                      <Text strong style={{ minWidth: 200 }}>
                        {item.caseTitle}
                      </Text>
                      <Tag color="blue">{item.module}</Tag>
                      <Progress
                        percent={item.failRate}
                        size="small"
                        status="exception"
                        style={{ width: 200, marginLeft: 'auto' }}
                      />
                      <Text type="danger" style={{ minWidth: 80, textAlign: 'right' }}>
                        失败 {item.failCount}/{item.totalCount} 次
                      </Text>
                    </Space>
                  </List.Item>
                )}
              />
            ) : (
              <Empty description="暂无失败用例" />
            )}
          </Card>
        </Col>
      </Row>

      <Card size="small" title="执行记录">
        <Space style={{ marginBottom: 16 }}>
          <span style={{ fontWeight: 500 }}>对比分析：</span>
          <Select
            placeholder="选择基准执行"
            value={compareBaseId || undefined}
            onChange={setCompareBaseId}
            style={{ width: 220 }}
            allowClear
          >
            {executions.map((e) => (
              <Option key={e.id} value={e.id}>
                {e.suiteName} - {e.startTime}
              </Option>
            ))}
          </Select>
          <LeftOutlined style={{ color: '#8c8c8c' }} />
          <RightOutlined style={{ color: '#8c8c8c' }} />
          <Select
            placeholder="选择对比执行"
            value={compareTargetId || undefined}
            onChange={setCompareTargetId}
            style={{ width: 220 }}
            allowClear
            disabled={!compareBaseId}
          >
            {sameSuiteExecutions.map((e) => (
              <Option key={e.id} value={e.id}>
                {e.suiteName} - {e.startTime}
              </Option>
            ))}
          </Select>
          <Button type="primary" onClick={handleCompare} disabled={!compareBaseId || !compareTargetId}>
            开始对比
          </Button>
        </Space>

        <Table
          columns={columns}
          dataSource={filteredExecutions}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条记录`,
          }}
        />
      </Card>

      <Modal
        title="执行详情"
        open={detailModal.visible}
        onCancel={() => setDetailModal({ visible: false, record: null })}
        footer={[
          <Button key="export" icon={<DownloadOutlined />}>
            导出报告
          </Button>,
          <Button key="close" onClick={() => setDetailModal({ visible: false, record: null })}>
            关闭
          </Button>,
        ]}
        width={900}
      >
        {detailModal.record && (
          <div>
            <Row gutter={16}>
              <Col span={8}>
                <div>
                  <Text type="secondary">套件名称</Text>
                  <div style={{ fontWeight: 500, fontSize: 16 }}>
                    {detailModal.record.suiteName}
                  </div>
                </div>
              </Col>
              <Col span={8}>
                <div>
                  <Text type="secondary">执行设备</Text>
                  <div style={{ fontWeight: 500, fontSize: 16 }}>
                    {detailModal.record.deviceName}
                  </div>
                </div>
              </Col>
              <Col span={8}>
                <div>
                  <Text type="secondary">执行状态</Text>
                  <div>{renderStatusTag(detailModal.record.status)}</div>
                </div>
              </Col>
            </Row>
            <Row gutter={16} style={{ marginTop: 16 }}>
              <Col span={6}>
                <div>
                  <Text type="secondary">开始时间</Text>
                  <div>{detailModal.record.startTime}</div>
                </div>
              </Col>
              <Col span={6}>
                <div>
                  <Text type="secondary">结束时间</Text>
                  <div>{detailModal.record.endTime || '-'}</div>
                </div>
              </Col>
              <Col span={6}>
                <div>
                  <Text type="secondary">通过率</Text>
                  <div
                    style={{
                      fontSize: 20,
                      fontWeight: 600,
                      color:
                        detailModal.record.passRate >= 80
                          ? '#52c41a'
                          : detailModal.record.passRate >= 60
                          ? '#faad14'
                          : '#ff4d4f',
                    }}
                  >
                    {detailModal.record.passRate}%
                  </div>
                </div>
              </Col>
              <Col span={6}>
                <div>
                  <Text type="secondary">用例数</Text>
                  <div>
                    <Text type="success">{detailModal.record.passedCases} 通过</Text> /{' '}
                    <Text type="danger">{detailModal.record.failedCases} 失败</Text> /{' '}
                    {detailModal.record.totalCases}
                  </div>
                </div>
              </Col>
            </Row>

            <Divider />

            <Title level={5}>用例详情</Title>
            <Table
              columns={caseColumns}
              dataSource={detailModal.record.results}
              rowKey="caseId"
              pagination={false}
              size="small"
              expandable={{
                expandedRowRender: expandedCaseRowRender,
                expandedRowKeys: Array.from(expandedCaseRows),
                onExpand: (expanded, record) => toggleCaseRow(record.caseId),
              }}
            />

            <Divider />

            <Title level={5}>执行日志</Title>
            <div className="log-panel" style={{ maxHeight: 200 }}>
              {detailModal.record.logs && detailModal.record.logs.length > 0 ? (
                detailModal.record.logs.map((log) => (
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

      <Modal
        title="执行对比分析"
        open={compareModalVisible}
        onCancel={() => setCompareModalVisible(false)}
        width={1000}
        footer={[
          <Button key="close" onClick={() => setCompareModalVisible(false)}>
            关闭
          </Button>,
        ]}
      >
        {compareBaseId && compareTargetId && (
          <>
            <Row gutter={16} style={{ marginBottom: 16 }}>
              <Col span={12}>
                <Card size="small" title="基准执行">
                  {executions.find((e) => e.id === compareBaseId) && (
                    <>
                      <div>
                        <Text type="secondary">套件：</Text>
                        {executions.find((e) => e.id === compareBaseId)?.suiteName}
                      </div>
                      <div>
                        <Text type="secondary">时间：</Text>
                        {executions.find((e) => e.id === compareBaseId)?.startTime}
                      </div>
                      <div>
                        <Text type="secondary">通过率：</Text>
                        <Text
                          strong
                          style={{
                            color:
                              (executions.find((e) => e.id === compareBaseId)?.passRate || 0) >= 80
                                ? '#52c41a'
                                : '#ff4d4f',
                          }}
                        >
                          {executions.find((e) => e.id === compareBaseId)?.passRate}%
                        </Text>
                      </div>
                    </>
                  )}
                </Card>
              </Col>
              <Col span={12}>
                <Card size="small" title="对比执行">
                  {executions.find((e) => e.id === compareTargetId) && (
                    <>
                      <div>
                        <Text type="secondary">套件：</Text>
                        {executions.find((e) => e.id === compareTargetId)?.suiteName}
                      </div>
                      <div>
                        <Text type="secondary">时间：</Text>
                        {executions.find((e) => e.id === compareTargetId)?.startTime}
                      </div>
                      <div>
                        <Text type="secondary">通过率：</Text>
                        <Text
                          strong
                          style={{
                            color:
                              (executions.find((e) => e.id === compareTargetId)?.passRate || 0) >= 80
                                ? '#52c41a'
                                : '#ff4d4f',
                          }}
                        >
                          {executions.find((e) => e.id === compareTargetId)?.passRate}%
                        </Text>
                      </div>
                    </>
                  )}
                </Card>
              </Col>
            </Row>

            <Tabs defaultActiveKey="all">
              <TabPane tab="全部变更" key="all">
                <Table
                  columns={comparisonColumns}
                  dataSource={comparisonResults}
                  rowKey="caseId"
                  size="small"
                  pagination={{ pageSize: 10 }}
                />
              </TabPane>
              <TabPane
                tab={
                  <span>
                    <ArrowDownOutlined style={{ color: '#ff4d4f' }} /> 新增失败 (
                    {comparisonResults.filter((r) => r.changeType === 'passed_to_failed').length})
                  </span>
                }
                key="new_failed"
              >
                <Table
                  columns={comparisonColumns}
                  dataSource={comparisonResults.filter(
                    (r) => r.changeType === 'passed_to_failed'
                  )}
                  rowKey="caseId"
                  size="small"
                  pagination={{ pageSize: 10 }}
                />
              </TabPane>
              <TabPane
                tab={
                  <span>
                    <ArrowUpOutlined style={{ color: '#52c41a' }} /> 修复通过 (
                    {comparisonResults.filter((r) => r.changeType === 'failed_to_passed').length})
                  </span>
                }
                key="fixed"
              >
                <Table
                  columns={comparisonColumns}
                  dataSource={comparisonResults.filter(
                    (r) => r.changeType === 'failed_to_passed'
                  )}
                  rowKey="caseId"
                  size="small"
                  pagination={{ pageSize: 10 }}
                />
              </TabPane>
              <TabPane
                tab={
                  <span>
                    <ClockCircleOutlined /> 耗时变长 (
                    {comparisonResults.filter((r) => r.changeType === 'slower').length})
                  </span>
                }
                key="slower"
              >
                <Table
                  columns={comparisonColumns}
                  dataSource={comparisonResults.filter((r) => r.changeType === 'slower')}
                  rowKey="caseId"
                  size="small"
                  pagination={{ pageSize: 10 }}
                />
              </TabPane>
            </Tabs>
          </>
        )}
      </Modal>

      <Modal
        title="日报预览"
        open={dailyPreviewVisible}
        onCancel={() => setDailyPreviewVisible(false)}
        width={700}
        footer={[
          <Button key="cancel" onClick={() => setDailyPreviewVisible(false)}>
            取消
          </Button>,
          <Button key="generate" type="primary" onClick={handleConfirmGenerateDaily}>
            确认生成
          </Button>,
        ]}
      >
        <div style={{ padding: 16, background: '#fafafa', borderRadius: 8 }}>
          <div style={{ textAlign: 'center', marginBottom: 16 }}>
            <Title level={4} style={{ margin: 0 }}>
              测试日报
            </Title>
            <Text type="secondary">{previewDate}</Text>
          </div>

          <Row gutter={16}>
            <Col span={8}>
              <Card size="small" style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 24, fontWeight: 600 }}>{filteredExecutions.length}</div>
                <div style={{ color: '#8c8c8c', fontSize: 12 }}>执行次数</div>
              </Card>
            </Col>
            <Col span={8}>
              <Card size="small" style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 24, fontWeight: 600, color: '#52c41a' }}>{avgPassRate}%</div>
                <div style={{ color: '#8c8c8c', fontSize: 12 }}>平均通过率</div>
              </Card>
            </Col>
            <Col span={8}>
              <Card size="small" style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 24, fontWeight: 600, color: '#ff4d4f' }}>
                  {failedCaseRanking.length}
                </div>
                <div style={{ color: '#8c8c8c', fontSize: 12 }}>失败用例数</div>
              </Card>
            </Col>
          </Row>

          <Divider orientation="left">失败用例明细</Divider>
          {failedCaseRanking.length > 0 ? (
            <List
              size="small"
              dataSource={failedCaseRanking.slice(0, 5)}
              renderItem={(item) => (
                <List.Item>
                  <Text>
                    <CloseCircleOutlined style={{ color: '#ff4d4f', marginRight: 8 }} />
                    {item.caseTitle}
                  </Text>
                  <Tag color="blue">{item.module}</Tag>
                </List.Item>
              )}
            />
          ) : (
            <Empty description="今日无失败用例" image={Empty.PRESENTED_IMAGE_SIMPLE} />
          )}

          <Divider orientation="left">关联缺陷</Divider>
          <Text type="secondary">
            今日执行中共关联 {failedCaseRanking.filter((r) => r.failCount > 0).length} 个待修复缺陷
          </Text>
        </div>
      </Modal>

      <Modal
        title="报告历史记录"
        open={reportHistoryVisible}
        onCancel={() => setReportHistoryVisible(false)}
        width={800}
        footer={[
          <Button key="close" onClick={() => setReportHistoryVisible(false)}>
            关闭
          </Button>,
        ]}
      >
        {reportRecords.length > 0 ? (
          <List
            dataSource={reportRecords}
            renderItem={(item: ReportRecord) => (
              <List.Item
                actions={[
                  <Button
                    type="link"
                    size="small"
                    icon={<EyeOutlined />}
                    onClick={() => {
                      setViewingReport(item)
                      setReportDetailVisible(true)
                    }}
                  >
                    查看
                  </Button>,
                  <Button
                    type="link"
                    size="small"
                    icon={<DownloadOutlined />}
                    onClick={() => {
                      const content = `报告名称: ${item.title}\n生成时间: ${item.createdAt}\n项目: ${item.filters.projectName || '全部项目'}\n套件: ${item.filters.suiteName || '全部套件'}\n设备: ${item.filters.deviceName || '全部设备'}\n\n概览:\n- 总执行次数: ${item.summary.totalExecutions}\n- 总用例数: ${item.summary.totalCases}\n- 通过: ${item.summary.passedCases}\n- 失败: ${item.summary.failedCases}\n- 通过率: ${item.summary.passRate}%\n\n失败用例数: ${item.failedCaseRanking.length}\n关联缺陷数: ${item.relatedDefects.length}`
                      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
                      const url = URL.createObjectURL(blob)
                      const a = document.createElement('a')
                      a.href = url
                      a.download = `${item.title}.txt`
                      a.click()
                      URL.revokeObjectURL(url)
                      message.success('导出成功')
                    }}
                  >
                    导出
                  </Button>,
                  <Popconfirm
                    key="delete"
                    title="确定删除这条记录吗？"
                    onConfirm={() => deleteReportRecord(item.id)}
                  >
                    <Button type="link" size="small" danger icon={<DeleteOutlined />}>
                      删除
                    </Button>
                  </Popconfirm>,
                ]}
              >
                <List.Item.Meta
                  avatar={
                    item.type === 'daily' ? (
                      <FileTextOutlined style={{ color: '#1677ff', fontSize: 20 }} />
                    ) : (
                      <BarChartOutlined style={{ color: '#52c41a', fontSize: 20 }} />
                    )
                  }
                  title={item.title}
                  description={
                    <Space>
                      <Text type="secondary">{item.createdAt}</Text>
                      {item.summary && (
                        <Tag>
                          通过率 {item.summary.passRate}%
                        </Tag>
                      )}
                      {item.type === 'daily' ? (
                        <Tag color="blue">日报</Tag>
                      ) : (
                        <Tag color="green">执行报告</Tag>
                      )}
                    </Space>
                  }
                />
              </List.Item>
            )}
          />
        ) : (
          <Empty description="暂无报告记录" />
        )}
      </Modal>

      <Modal
        title="报告详情"
        open={reportDetailVisible}
        onCancel={() => setReportDetailVisible(false)}
        width={1000}
        footer={[
          <Button
            key="export"
            icon={<DownloadOutlined />}
            onClick={() => {
              if (!viewingReport) return
              const trendText = viewingReport.trendData
                .map((t) => `${t.date}: 通过率${t.passRate}%, 执行${t.executionCount}次`)
                .join('\n  ')
              const failedText = viewingReport.failedCaseRanking
                .map((f, i) => `${i + 1}. ${f.caseTitle} - 失败${f.failCount}次`)
                .join('\n  ')
              const defectText = viewingReport.relatedDefects
                .map((d) => `${d.defectId} - ${d.title} [${d.status}]`)
                .join('\n  ')

              const content = `报告名称: ${viewingReport.title}\n生成时间: ${viewingReport.createdAt}\n类型: ${viewingReport.type === 'daily' ? '日报' : '执行报告'}\n\n筛选条件:\n  项目: ${viewingReport.filters.projectName || '全部项目'}\n  套件: ${viewingReport.filters.suiteName || '全部套件'}\n  设备: ${viewingReport.filters.deviceName || '全部设备'}\n  时间范围: ${viewingReport.filters.startDate || '不限'} ~ ${viewingReport.filters.endDate || '不限'}\n\n执行概览:\n  总执行次数: ${viewingReport.summary.totalExecutions}\n  总用例数: ${viewingReport.summary.totalCases}\n  通过用例: ${viewingReport.summary.passedCases}\n  失败用例: ${viewingReport.summary.failedCases}\n  通过率: ${viewingReport.summary.passRate}%\n\n通过率趋势:\n  ${trendText}\n\n失败用例排行:\n  ${failedText || '无'}\n\n关联缺陷:\n  ${defectText || '无'}\n`
              const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
              const url = URL.createObjectURL(blob)
              const a = document.createElement('a')
              a.href = url
              a.download = `${viewingReport.title}.txt`
              a.click()
              URL.revokeObjectURL(url)
              message.success('导出成功')
            }}
          >
            导出报告
          </Button>,
          <Button key="close" onClick={() => setReportDetailVisible(false)}>
            关闭
          </Button>,
        ]}
      >
        {viewingReport && (
          <div>
            <Card size="small" style={{ marginBottom: 16 }}>
              <Space direction="vertical" size={8} style={{ width: '100%' }}>
                <div>
                  <Text type="secondary">报告标题：</Text>
                  <Text strong>{viewingReport.title}</Text>
                </div>
                <div>
                  <Text type="secondary">生成时间：</Text>
                  {viewingReport.createdAt}
                </div>
                <div>
                  <Text type="secondary">筛选条件：</Text>
                  <Space wrap style={{ marginLeft: 8 }}>
                    <Tag color="blue">{viewingReport.filters.projectName || '全部项目'}</Tag>
                    <Tag color="green">{viewingReport.filters.suiteName || '全部套件'}</Tag>
                    <Tag color="orange">{viewingReport.filters.deviceName || '全部设备'}</Tag>
                    {viewingReport.filters.startDate && (
                      <Tag>
                        {viewingReport.filters.startDate} ~ {viewingReport.filters.endDate}
                      </Tag>
                    )}
                  </Space>
                </div>
              </Space>
            </Card>

            <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
              <Col span={6}>
                <Card>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 24, fontWeight: 600 }}>
                      {viewingReport.summary.totalExecutions}
                    </div>
                    <div style={{ color: '#8c8c8c' }}>总执行次数</div>
                  </div>
                </Card>
              </Col>
              <Col span={6}>
                <Card>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 24, fontWeight: 600, color: '#52c41a' }}>
                      {viewingReport.summary.passedCases}
                    </div>
                    <div style={{ color: '#8c8c8c' }}>通过用例</div>
                  </div>
                </Card>
              </Col>
              <Col span={6}>
                <Card>
                  <div style={{ textAlign: 'center' }}>
                    <div
                      style={{
                        fontSize: 24,
                        fontWeight: 600,
                        color:
                          viewingReport.summary.passRate >= 80 ? '#52c41a' : '#faad14',
                      }}
                    >
                      {viewingReport.summary.passRate}%
                    </div>
                    <div style={{ color: '#8c8c8c' }}>通过率</div>
                  </div>
                </Card>
              </Col>
              <Col span={6}>
                <Card>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 24, fontWeight: 600, color: '#ff4d4f' }}>
                      {viewingReport.summary.failedCases}
                    </div>
                    <div style={{ color: '#8c8c8c' }}>失败用例</div>
                  </div>
                </Card>
              </Col>
            </Row>

            <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
              <Col span={16}>
                <Card size="small" title="通过率趋势">
                  <ReactECharts
                    option={{
                      tooltip: { trigger: 'axis' },
                      grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
                      xAxis: {
                        type: 'category',
                        data: viewingReport.trendData.map((t) => t.date),
                      },
                      yAxis: {
                        type: 'value',
                        max: 100,
                        axisLabel: { formatter: '{value}%' },
                      },
                      series: [
                        {
                          type: 'line',
                          smooth: true,
                          data: viewingReport.trendData.map((t) => t.passRate),
                          areaStyle: {
                            color: {
                              type: 'linear',
                              x: 0, y: 0, x2: 0, y2: 1,
                              colorStops: [
                                { offset: 0, color: 'rgba(22, 119, 255, 0.3)' },
                                { offset: 1, color: 'rgba(22, 119, 255, 0.05)' },
                              ],
                            },
                          },
                          lineStyle: { color: '#1677ff', width: 2 },
                          itemStyle: { color: '#1677ff' },
                        },
                      ],
                    }}
                    style={{ height: 220 }}
                  />
                </Card>
              </Col>
              <Col span={8}>
                <Card size="small" title="失败原因分布">
                  {viewingReport.failureReasons.length > 0 ? (
                    <ReactECharts
                      option={{
                        tooltip: { trigger: 'item', formatter: '{b}: {c}次 ({d}%)' },
                        legend: { orient: 'vertical', right: 5, top: 'center', textStyle: { fontSize: 11 } },
                        series: [
                          {
                            type: 'pie',
                            radius: ['50%', '70%'],
                            center: ['30%', '50%'],
                            label: { show: false },
                            data: viewingReport.failureReasons.map((r, idx) => ({
                              value: r.count,
                              name: r.reason,
                              itemStyle: {
                                color: ['#ff4d4f', '#faad14', '#722ed1', '#13c2c2', '#8c8c8c'][
                                  idx % 5
                                ],
                              },
                            })),
                          },
                        ],
                      }}
                      style={{ height: 220 }}
                    />
                  ) : (
                    <Empty
                      description="暂无失败数据"
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                      style={{ paddingTop: 50 }}
                    />
                  )}
                </Card>
              </Col>
            </Row>

            <Card size="small" title="失败用例明细" style={{ marginBottom: 16 }}>
              {viewingReport.failedCaseRanking.length > 0 ? (
                <List
                  size="small"
                  dataSource={viewingReport.failedCaseRanking.slice(0, 10)}
                  renderItem={(item, index) => (
                    <List.Item style={{ padding: '8px 0' }}>
                      <Space style={{ width: '100%' }} align="start">
                        <Tag color={index < 3 ? 'red' : 'default'} style={{ minWidth: 28, textAlign: 'center' }}>
                          {index + 1}
                        </Tag>
                        <div style={{ flex: 1 }}>
                          <div>
                            <Text strong>{item.caseTitle}</Text>
                            <Tag color="blue" style={{ marginLeft: 8 }}>
                              {item.module}
                            </Tag>
                          </div>
                          {item.errorMessage && (
                            <div style={{ fontSize: 12, color: '#ff4d4f', marginTop: 4 }}>
                              错误：{item.errorMessage}
                            </div>
                          )}
                          {item.defects && item.defects.length > 0 && (
                            <div style={{ marginTop: 4 }}>
                              {item.defects.map((d) => (
                                <Tag key={d.defectId} color="red" style={{ fontSize: 11 }}>
                                  <BugOutlined /> {d.defectId} ({d.status})
                                </Tag>
                              ))}
                            </div>
                          )}
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <Text type="danger">
                            失败 {item.failCount} 次
                          </Text>
                          <div style={{ fontSize: 11, color: '#8c8c8c' }}>
                            失败率 {item.failRate}%
                          </div>
                        </div>
                      </Space>
                    </List.Item>
                  )}
                />
              ) : (
                <Empty description="无失败用例" image={Empty.PRESENTED_IMAGE_SIMPLE} />
              )}
            </Card>

            <Card size="small" title="关联缺陷">
              {viewingReport.relatedDefects.length > 0 ? (
                <List
                  size="small"
                  dataSource={viewingReport.relatedDefects}
                  renderItem={(item) => (
                    <List.Item>
                      <List.Item.Meta
                        avatar={<BugOutlined style={{ color: '#ff4d4f', fontSize: 18 }} />}
                        title={
                          <Space>
                            <Text strong>{item.defectId}</Text>
                            <Tag
                              color={
                                item.status === 'open'
                                  ? 'red'
                                  : item.status === 'fixed'
                                  ? 'green'
                                  : 'default'
                              }
                            >
                              {item.status === 'open' ? '待修复' : item.status === 'fixed' ? '已修复' : item.status}
                            </Tag>
                            <Tag color="orange">{item.severity}</Tag>
                          </Space>
                        }
                        description={item.title}
                      />
                    </List.Item>
                  )}
                />
              ) : (
                <Empty description="无关联缺陷" image={Empty.PRESENTED_IMAGE_SIMPLE} />
              )}
            </Card>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default ResultReport
