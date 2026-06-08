import { useState } from 'react'
import {
  Card,
  Row,
  Col,
  Button,
  Input,
  Select,
  Modal,
  Form,
  Table,
  Tag,
  message,
  Popconfirm,
  Typography,
  Space,
  List,
  Divider,
  Empty,
} from 'antd'
import {
  BugOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  LinkOutlined,
  SearchOutlined,
  ExportOutlined,
  AppstoreOutlined,
  CloseOutlined,
} from '@ant-design/icons'
import { useAppStore } from '@/store'
import type { Defect, TestCase } from '@/types'

const { Title, Text } = Typography
const { Option } = Select
const { TextArea } = Input

function DefectAssociation() {
  const {
    defects,
    cases,
    addDefect,
    updateDefect,
    deleteDefect,
    associateCaseToDefect,
    removeCaseFromDefect,
  } = useAppStore()

  const [modalVisible, setModalVisible] = useState(false)
  const [editingDefect, setEditingDefect] = useState<Defect | null>(null)
  const [searchKeyword, setSearchKeyword] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [form] = Form.useForm()
  const [associateModal, setAssociateModal] = useState<{
    visible: boolean
    defect: Defect | null
  }>({ visible: false, defect: null })
  const [caseSearch, setCaseSearch] = useState('')

  const filteredDefects = defects.filter((d) => {
    const matchKeyword =
      !searchKeyword ||
      d.defectId.toLowerCase().includes(searchKeyword.toLowerCase()) ||
      d.title.toLowerCase().includes(searchKeyword.toLowerCase())
    const matchStatus = statusFilter === 'all' || d.status === statusFilter
    return matchKeyword && matchStatus
  })

  const filteredCases = cases.filter((c) => {
    if (!caseSearch) return true
    return (
      c.title.toLowerCase().includes(caseSearch.toLowerCase()) ||
      c.module.toLowerCase().includes(caseSearch.toLowerCase())
    )
  })

  const handleAdd = () => {
    setEditingDefect(null)
    form.resetFields()
    setModalVisible(true)
  }

  const handleEdit = (defect: Defect) => {
    setEditingDefect(defect)
    form.setFieldsValue(defect)
    setModalVisible(true)
  }

  const handleSubmit = () => {
    form.validateFields().then((values) => {
      if (editingDefect) {
        updateDefect(editingDefect.id, values)
        message.success('更新成功')
      } else {
        addDefect({
          ...values,
          caseIds: [],
        })
        message.success('创建成功')
      }
      setModalVisible(false)
    })
  }

  const handleDelete = (id: string) => {
    deleteDefect(id)
    message.success('删除成功')
  }

  const handleOpenAssociate = (defect: Defect) => {
    setAssociateModal({ visible: true, defect })
    setCaseSearch('')
  }

  const handleAssociateCase = (caseId: string) => {
    if (!associateModal.defect) return
    associateCaseToDefect(associateModal.defect.id, caseId)
    message.success('关联成功')
  }

  const handleRemoveCase = (caseId: string) => {
    if (!associateModal.defect) return
    removeCaseFromDefect(associateModal.defect.id, caseId)
    message.success('已移除关联')
  }

  const getSeverityTag = (severity: string) => {
    const colorMap: Record<string, string> = {
      critical: 'red',
      major: 'orange',
      minor: 'blue',
      trivial: 'default',
    }
    const textMap: Record<string, string> = {
      critical: '严重',
      major: '主要',
      minor: '次要',
      trivial: '轻微',
    }
    return <Tag color={colorMap[severity]}>{textMap[severity] || severity}</Tag>
  }

  const getStatusTag = (status: string) => {
    const colorMap: Record<string, string> = {
      open: 'red',
      fixed: 'green',
      closed: 'default',
      reopen: 'orange',
    }
    const textMap: Record<string, string> = {
      open: '待处理',
      fixed: '已修复',
      closed: '已关闭',
      reopen: '重新打开',
    }
    return <Tag color={colorMap[status]}>{textMap[status] || status}</Tag>
  }

  const getAssociatedCases = (defect: Defect): TestCase[] => {
    return defect.caseIds
      .map((cid) => cases.find((c) => c.id === cid))
      .filter((c): c is TestCase => c !== undefined)
  }

  const getAvailableCases = (defect: Defect): TestCase[] => {
    return filteredCases.filter((c) => !defect.caseIds.includes(c.id))
  }

  const columns = [
    {
      title: '缺陷编号',
      dataIndex: 'defectId',
      key: 'defectId',
      width: 140,
      render: (id: string) => (
        <Text strong code>
          {id}
        </Text>
      ),
    },
    {
      title: '缺陷标题',
      dataIndex: 'title',
      key: 'title',
      width: 280,
      ellipsis: true,
    },
    {
      title: '严重程度',
      dataIndex: 'severity',
      key: 'severity',
      width: 100,
      render: (severity: string) => getSeverityTag(severity),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => getStatusTag(status),
    },
    {
      title: '关联用例数',
      dataIndex: 'caseIds',
      key: 'caseIds',
      width: 100,
      render: (caseIds: string[]) => (
        <Tag color={caseIds.length > 0 ? 'blue' : 'default'}>{caseIds.length} 个</Tag>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 160,
    },
    {
      title: '操作',
      key: 'actions',
      width: 220,
      fixed: 'right' as const,
      render: (_: unknown, record: Defect) => (
        <Space size="small">
          <Button type="link" size="small" icon={<LinkOutlined />} onClick={() => handleOpenAssociate(record)}>
            关联用例
          </Button>
          {record.url && (
            <Button
              type="link"
              size="small"
              icon={<ExportOutlined />}
              onClick={() => window.open(record.url, '_blank')}
            >
              打开
            </Button>
          )}
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            编辑
          </Button>
          <Popconfirm title="确定删除该缺陷？" onConfirm={() => handleDelete(record.id)}>
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  const openCount = defects.filter((d) => d.status === 'open').length
  const fixedCount = defects.filter((d) => d.status === 'fixed').length
  const criticalCount = defects.filter((d) => d.severity === 'critical').length

  const currentDefect = associateModal.defect
    ? defects.find((d) => d.id === associateModal.defect?.id)
    : null

  return (
    <div>
      <div className="page-header">
        <div className="page-title">
          <BugOutlined style={{ marginRight: 8 }} />
          缺陷关联
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          新建缺陷
        </Button>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <BugOutlined style={{ fontSize: 28, color: '#ff4d4f' }} />
              <div>
                <div style={{ fontSize: 24, fontWeight: 600, color: '#ff4d4f' }}>{defects.length}</div>
                <div style={{ color: '#8c8c8c' }}>缺陷总数</div>
              </div>
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 4,
                  background: '#ff7a45',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontWeight: 600,
                }}
              >
                {openCount}
              </div>
              <div>
                <div style={{ fontSize: 24, fontWeight: 600, color: '#ff7a45' }}>{openCount}</div>
                <div style={{ color: '#8c8c8c' }}>待处理</div>
              </div>
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 4,
                  background: '#52c41a',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontWeight: 600,
                }}
              >
                ✓
              </div>
              <div>
                <div style={{ fontSize: 24, fontWeight: 600, color: '#52c41a' }}>{fixedCount}</div>
                <div style={{ color: '#8c8c8c' }}>已修复</div>
              </div>
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 4,
                  background: '#ff4d4f',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontWeight: 600,
                }}
              >
                !!!
              </div>
              <div>
                <div style={{ fontSize: 24, fontWeight: 600, color: '#ff4d4f' }}>{criticalCount}</div>
                <div style={{ color: '#8c8c8c' }}>严重缺陷</div>
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      <Card size="small">
        <Space style={{ marginBottom: 16 }} wrap>
          <Input
            placeholder="搜索缺陷编号或标题"
            prefix={<SearchOutlined />}
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            style={{ width: 250 }}
            allowClear
          />
          <Select value={statusFilter} onChange={setStatusFilter} style={{ width: 150 }}>
            <Option value="all">全部状态</Option>
            <Option value="open">待处理</Option>
            <Option value="fixed">已修复</Option>
            <Option value="closed">已关闭</Option>
            <Option value="reopen">重新打开</Option>
          </Select>
        </Space>

        <Table
          columns={columns}
          dataSource={filteredDefects}
          rowKey="id"
          scroll={{ x: 1100 }}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条缺陷`,
          }}
        />
      </Card>

      <Modal
        title={editingDefect ? '编辑缺陷' : '新建缺陷'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        okText="保存"
        cancelText="取消"
        width={600}
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="defectId"
                label="缺陷编号"
                rules={[{ required: true, message: '请输入缺陷编号' }]}
              >
                <Input placeholder="如：BUG-2024001" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="severity"
                label="严重程度"
                rules={[{ required: true, message: '请选择严重程度' }]}
                initialValue="major"
              >
                <Select>
                  <Option value="critical">严重</Option>
                  <Option value="major">主要</Option>
                  <Option value="minor">次要</Option>
                  <Option value="trivial">轻微</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Form.Item
            name="title"
            label="缺陷标题"
            rules={[{ required: true, message: '请输入缺陷标题' }]}
          >
            <Input placeholder="请输入缺陷标题" />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="status"
                label="状态"
                rules={[{ required: true, message: '请选择状态' }]}
                initialValue="open"
              >
                <Select>
                  <Option value="open">待处理</Option>
                  <Option value="fixed">已修复</Option>
                  <Option value="closed">已关闭</Option>
                  <Option value="reopen">重新打开</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="url" label="缺陷链接">
                <Input placeholder="Jira/禅道等链接" />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      <Modal
        title="关联测试用例"
        open={associateModal.visible}
        onCancel={() => setAssociateModal({ visible: false, defect: null })}
        footer={[
          <Button key="close" onClick={() => setAssociateModal({ visible: false, defect: null })}>
            关闭
          </Button>,
        ]}
        width={800}
        styles={{ body: { maxHeight: '60vh', overflowY: 'auto' } }}
      >
        {currentDefect && (
          <div>
            <Card size="small" style={{ marginBottom: 16 }}>
              <Row gutter={16}>
                <Col span={12}>
                  <div>
                    <Text type="secondary">缺陷编号</Text>
                    <div>
                      <Text code strong>
                        {currentDefect.defectId}
                      </Text>
                    </div>
                  </div>
                </Col>
                <Col span={12}>
                  <div>
                    <Text type="secondary">状态</Text>
                    <div>{getStatusTag(currentDefect.status)}</div>
                  </div>
                </Col>
              </Row>
              <div style={{ marginTop: 8 }}>
                <Text type="secondary">缺陷标题</Text>
                <div>{currentDefect.title}</div>
              </div>
            </Card>

            <Divider orientation="left">
              已关联用例 ({getAssociatedCases(currentDefect).length})
            </Divider>
            {getAssociatedCases(currentDefect).length > 0 ? (
              <List
                size="small"
                dataSource={getAssociatedCases(currentDefect)}
                renderItem={(item) => (
                  <List.Item
                    actions={[
                      <Button
                        key="remove"
                        type="text"
                        size="small"
                        danger
                        icon={<CloseOutlined />}
                        onClick={() => handleRemoveCase(item.id)}
                      >
                        移除
                      </Button>,
                    ]}
                  >
                    <List.Item.Meta
                      avatar={<AppstoreOutlined style={{ color: '#1677ff' }} />}
                      title={item.title}
                      description={
                        <Space size="small">
                          <Tag color="blue">{item.module}</Tag>
                          <span className={`priority-tag-${item.priority}`}>{item.priority}</span>
                        </Space>
                      }
                    />
                  </List.Item>
                )}
              />
            ) : (
              <Empty description="暂无关联用例" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            )}

            <Divider orientation="left">
              可关联用例 ({getAvailableCases(currentDefect).length})
            </Divider>
            <Input
              placeholder="搜索用例标题或模块..."
              prefix={<SearchOutlined />}
              value={caseSearch}
              onChange={(e) => setCaseSearch(e.target.value)}
              allowClear
              style={{ marginBottom: 12 }}
            />
            {getAvailableCases(currentDefect).length > 0 ? (
              <List
                size="small"
                dataSource={getAvailableCases(currentDefect)}
                style={{ maxHeight: 200, overflowY: 'auto' }}
                renderItem={(item) => (
                  <List.Item
                    actions={[
                      <Button
                        key="associate"
                        type="link"
                        size="small"
                        icon={<LinkOutlined />}
                        onClick={() => handleAssociateCase(item.id)}
                      >
                        关联
                      </Button>,
                    ]}
                  >
                    <List.Item.Meta
                      avatar={<AppstoreOutlined style={{ color: '#8c8c8c' }} />}
                      title={item.title}
                      description={
                        <Space size="small">
                          <Tag color="blue">{item.module}</Tag>
                          <span className={`priority-tag-${item.priority}`}>{item.priority}</span>
                        </Space>
                      }
                    />
                  </List.Item>
                )}
              />
            ) : (
              <Empty description="没有可关联的用例" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}

export default DefectAssociation
