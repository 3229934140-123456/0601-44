import { useState } from 'react'
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
} from 'antd'
import {
  FileTextOutlined,
  DownloadOutlined,
  BarChartOutlined,
  RiseOutlined,
  FallOutlined,
  AppstoreOutlined,
  ExportOutlined,
} from '@ant-design/icons'
import ReactECharts from 'echarts-for-react'
import { useAppStore } from '@/store'
import type { ExecutionRecord } from '@/types'
import dayjs from 'dayjs'

const { Title, Text } = Typography
const { Option } = Select
const { RangePicker } = DatePicker

function ResultReport() {
  const { executions, suites } = useAppStore()
  const [selectedSuite, setSelectedSuite] = useState<string>('all')
  const [detailModal, setDetailModal] = useState<{ visible: boolean; record: ExecutionRecord | null }>({
    visible: false,
    record: null,
  })

  const filteredExecutions =
    selectedSuite === 'all'
      ? executions
      : executions.filter((e) => e.suiteId === selectedSuite)

  const totalExecutions = filteredExecutions.length
  const passedExecutions = filteredExecutions.filter((e) => e.status === 'passed').length
  const avgPassRate =
    totalExecutions > 0
      ? Math.round(filteredExecutions.reduce((sum, e) => sum + e.passRate, 0) / totalExecutions)
      : 0

  const trendData = () => {
    const last7Days: string[] = []
    for (let i = 6; i >= 0; i--) {
      last7Days.push(dayjs().subtract(i, 'day').format('MM-DD'))
    }

    const passRates = last7Days.map((_, index) => {
      const dayExecutions = executions.filter((e) => {
        const execDate = dayjs(e.startTime).format('MM-DD')
        return execDate === last7Days[index]
      })
      if (dayExecutions.length === 0) return 0
      return Math.round(dayExecutions.reduce((sum, e) => sum + e.passRate, 0) / dayExecutions.length)
    })

    return { dates: last7Days, passRates }
  }

  const { dates, passRates } = trendData()

  const trendChartOption = {
    tooltip: {
      trigger: 'axis',
      formatter: '{b}<br/>通过率: {c}%',
    },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: {
      type: 'category',
      data: dates,
      boundaryGap: false,
    },
    yAxis: {
      type: 'value',
      max: 100,
      min: 0,
      axisLabel: {
        formatter: '{value}%',
      },
    },
    series: [
      {
        name: '通过率',
        type: 'line',
        smooth: true,
        data: passRates,
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(22, 119, 255, 0.3)' },
              { offset: 1, color: 'rgba(22, 119, 255, 0.05)' },
            ],
          },
        },
        lineStyle: {
          color: '#1677ff',
          width: 2,
        },
        itemStyle: {
          color: '#1677ff',
        },
      },
    ],
  }

  const distributionOption = {
    tooltip: {
      trigger: 'item',
    },
    legend: {
      orient: 'vertical',
      right: 10,
      top: 'center',
    },
    series: [
      {
        name: '执行状态',
        type: 'pie',
        radius: ['50%', '70%'],
        avoidLabelOverlap: false,
        label: {
          show: false,
          position: 'center',
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 20,
            fontWeight: 'bold',
          },
        },
        labelLine: {
          show: false,
        },
        data: [
          {
            value: executions.filter((e) => e.status === 'passed').length,
            name: '通过',
            itemStyle: { color: '#52c41a' },
          },
          {
            value: executions.filter((e) => e.status === 'failed').length,
            name: '失败',
            itemStyle: { color: '#ff4d4f' },
          },
          {
            value: executions.filter((e) => e.status === 'running').length,
            name: '执行中',
            itemStyle: { color: '#1677ff' },
          },
          {
            value: executions.filter((e) => e.status === 'cancelled').length,
            name: '已取消',
            itemStyle: { color: '#8c8c8c' },
          },
        ],
      },
    ],
  }

  const handleExportReport = () => {
    message.success('报告导出成功')
  }

  const handleGenerateDaily = () => {
    message.success('日报生成成功')
  }

  const handleViewDetail = (record: ExecutionRecord) => {
    setDetailModal({ visible: true, record })
  }

  const columns = [
    {
      title: '执行时间',
      dataIndex: 'startTime',
      key: 'startTime',
      width: 180,
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
        const statusMap: Record<string, { color: string; text: string }> = {
          running: { color: 'processing', text: '执行中' },
          passed: { color: 'success', text: '通过' },
          failed: { color: 'error', text: '失败' },
          cancelled: { color: 'default', text: '已取消' },
        }
        const s = statusMap[status] || { color: 'default', text: status }
        return <Tag color={s.color}>{s.text}</Tag>
      },
    },
    {
      title: '通过率',
      dataIndex: 'passRate',
      key: 'passRate',
      width: 150,
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
      width: 180,
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

  return (
    <div>
      <div className="page-header">
        <div className="page-title">
          <FileTextOutlined style={{ marginRight: 8 }} />
          结果报告
        </div>
        <Space>
          <Button icon={<ExportOutlined />} onClick={handleGenerateDaily}>
            生成日报
          </Button>
          <Button type="primary" icon={<DownloadOutlined />} onClick={handleExportReport}>
            导出报告
          </Button>
        </Space>
      </div>

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
              <FallOutlined style={{ fontSize: 32, color: '#faad14' }} />
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
              <FileTextOutlined style={{ fontSize: 32, color: '#722ed1' }} />
              <div>
                <div style={{ fontSize: 24, fontWeight: 600, color: '#722ed1' }}>
                  {suites.length}
                </div>
                <div style={{ color: '#8c8c8c' }}>测试套件</div>
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
          <Card size="small" title="执行状态分布">
            <ReactECharts option={distributionOption} style={{ height: 280 }} />
          </Card>
        </Col>
      </Row>

      <Card size="small" title="历史执行记录">
        <Space style={{ marginBottom: 16 }}>
          <Select
            value={selectedSuite}
            onChange={setSelectedSuite}
            style={{ width: 200 }}
          >
            <Option value="all">全部套件</Option>
            {suites.map((s) => (
              <Option key={s.id} value={s.id}>
                {s.name}
              </Option>
            ))}
          </Select>
          <RangePicker />
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
        width={800}
      >
        {detailModal.record && (
          <div>
            <Row gutter={16}>
              <Col span={12}>
                <div>
                  <Text type="secondary">套件名称</Text>
                  <div style={{ fontWeight: 500, fontSize: 16 }}>
                    {detailModal.record.suiteName}
                  </div>
                </div>
              </Col>
              <Col span={12}>
                <div>
                  <Text type="secondary">执行设备</Text>
                  <div style={{ fontWeight: 500, fontSize: 16 }}>
                    {detailModal.record.deviceName}
                  </div>
                </div>
              </Col>
            </Row>
            <Row gutter={16} style={{ marginTop: 16 }}>
              <Col span={8}>
                <div>
                  <Text type="secondary">开始时间</Text>
                  <div>{detailModal.record.startTime}</div>
                </div>
              </Col>
              <Col span={8}>
                <div>
                  <Text type="secondary">结束时间</Text>
                  <div>{detailModal.record.endTime || '-'}</div>
                </div>
              </Col>
              <Col span={8}>
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
            </Row>

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
    </div>
  )
}

export default ResultReport
