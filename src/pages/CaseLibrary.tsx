import { useState } from 'react'
import {
  Table,
  Button,
  Input,
  Tag,
  Space,
  Modal,
  Form,
  InputNumber,
  Select,
  message,
  Popconfirm,
  Card,
  Row,
  Col,
  List,
  Typography,
  Divider,
} from 'antd'
import {
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  AppstoreOutlined,
} from '@ant-design/icons'
import { useAppStore } from '@/store'
import type { TestCase, TestStep } from '@/types'
import { v4 as uuidv4 } from 'uuid'

const { Title, Text } = Typography
const { TextArea } = Input
const { Option } = Select

function CaseLibrary() {
  const {
    cases,
    getFilteredCases,
    getAllTags,
    selectedTags,
    setSelectedTags,
    searchKeyword,
    setSearchKeyword,
    addCase,
    updateCase,
    deleteCase,
  } = useAppStore()

  const [modalVisible, setModalVisible] = useState(false)
  const [detailVisible, setDetailVisible] = useState(false)
  const [editingCase, setEditingCase] = useState<TestCase | null>(null)
  const [viewingCase, setViewingCase] = useState<TestCase | null>(null)
  const [form] = Form.useForm()
  const [steps, setSteps] = useState<TestStep[]>([])

  const filteredCases = getFilteredCases()
  const allTags = getAllTags()

  const handleAdd = () => {
    setEditingCase(null)
    setSteps([{ id: uuidv4(), order: 1, action: '', expected: '' }])
    form.resetFields()
    setModalVisible(true)
  }

  const handleEdit = (record: TestCase) => {
    setEditingCase(record)
    setSteps([...record.steps])
    form.setFieldsValue({
      title: record.title,
      module: record.module,
      priority: record.priority,
      preconditions: record.preconditions,
      tags: record.tags,
    })
    setModalVisible(true)
  }

  const handleView = (record: TestCase) => {
    setViewingCase(record)
    setDetailVisible(true)
  }

  const handleDelete = (id: string) => {
    deleteCase(id)
    message.success('删除成功')
  }

  const handleSubmit = () => {
    form.validateFields().then((values) => {
      const validSteps = steps.filter((s) => s.action.trim())
      if (validSteps.length === 0) {
        message.error('至少添加一个测试步骤')
        return
      }

      const caseData = {
        title: values.title,
        module: values.module,
        priority: values.priority,
        preconditions: values.preconditions,
        tags: values.tags || [],
        steps: validSteps.map((s, i) => ({ ...s, order: i + 1 })),
      }

      if (editingCase) {
        updateCase(editingCase.id, caseData)
        message.success('更新成功')
      } else {
        addCase(caseData)
        message.success('创建成功')
      }
      setModalVisible(false)
    })
  }

  const addStep = () => {
    setSteps([...steps, { id: uuidv4(), order: steps.length + 1, action: '', expected: '' }])
  }

  const removeStep = (id: string) => {
    setSteps(steps.filter((s) => s.id !== id).map((s, i) => ({ ...s, order: i + 1 })))
  }

  const updateStep = (id: string, field: 'action' | 'expected', value: string) => {
    setSteps(steps.map((s) => (s.id === id ? { ...s, [field]: value } : s)))
  }

  const moveStep = (index: number, direction: 'up' | 'down') => {
    const newSteps = [...steps]
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= newSteps.length) return
    ;[newSteps[index], newSteps[targetIndex]] = [newSteps[targetIndex], newSteps[index]]
    setSteps(newSteps.map((s, i) => ({ ...s, order: i + 1 })))
  }

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
      render: (_: string, record: TestCase) => <Text code>{record.id.slice(0, 8)}</Text>,
    },
    {
      title: '用例标题',
      dataIndex: 'title',
      key: 'title',
      width: 250,
      render: (text: string) => <Text strong>{text}</Text>,
    },
    {
      title: '模块',
      dataIndex: 'module',
      key: 'module',
      width: 120,
    },
    {
      title: '优先级',
      dataIndex: 'priority',
      key: 'priority',
      width: 80,
      render: (priority: string) => (
        <span className={`priority-tag-${priority}`}>{priority}</span>
      ),
    },
    {
      title: '标签',
      dataIndex: 'tags',
      key: 'tags',
      width: 200,
      render: (tags: string[]) => (
        <>
          {tags.map((tag) => (
            <Tag color="blue" key={tag} style={{ marginBottom: 4 }}>
              {tag}
            </Tag>
          ))}
        </>
      ),
    },
    {
      title: '步骤数',
      dataIndex: 'steps',
      key: 'steps',
      width: 80,
      render: (steps: TestStep[]) => steps.length,
    },
    {
      title: '更新时间',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      width: 160,
    },
    {
      title: '操作',
      key: 'actions',
      width: 180,
      fixed: 'right' as const,
      render: (_: unknown, record: TestCase) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleView(record)}>
            查看
          </Button>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            编辑
          </Button>
          <Popconfirm title="确定删除该用例？" onConfirm={() => handleDelete(record.id)}>
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <div>
      <div className="page-header">
        <div className="page-title">
          <AppstoreOutlined style={{ marginRight: 8 }} />
          用例库管理
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          新建用例
        </Button>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col span={18}>
          <Card size="small" title="筛选条件">
            <Space direction="vertical" style={{ width: '100%' }} size="middle">
              <Input
                placeholder="搜索用例标题、模块..."
                prefix={<SearchOutlined />}
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                allowClear
              />
              <div>
                <Text type="secondary" style={{ marginRight: 8 }}>
                  标签筛选：
                </Text>
                {allTags.length > 0 ? (
                  allTags.map((tag) => {
                    const isSelected = selectedTags.includes(tag)
                    return (
                      <Tag
                        key={tag}
                        color={isSelected ? 'blue' : 'default'}
                        style={{ cursor: 'pointer', marginBottom: 4 }}
                        onClick={() => {
                          if (isSelected) {
                            setSelectedTags(selectedTags.filter((t) => t !== tag))
                          } else {
                            setSelectedTags([...selectedTags, tag])
                          }
                        }}
                      >
                        {tag}
                      </Tag>
                    )
                  })
                ) : (
                  <Text type="secondary">暂无标签</Text>
                )}
                {selectedTags.length > 0 && (
                  <Button type="link" size="small" onClick={() => setSelectedTags([])}>
                    清除筛选
                  </Button>
                )}
              </div>
            </Space>
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small" title="统计信息">
            <Row gutter={[8, 8]}>
              <Col span={12}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 24, fontWeight: 600, color: '#1677ff' }}>
                    {cases.length}
                  </div>
                  <div style={{ color: '#8c8c8c', fontSize: 12 }}>总用例数</div>
                </div>
              </Col>
              <Col span={12}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 24, fontWeight: 600, color: '#ff4d4f' }}>
                    {cases.filter((c) => c.priority === 'P0').length}
                  </div>
                  <div style={{ color: '#8c8c8c', fontSize: 12 }}>P0 用例</div>
                </div>
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>

      <Table
        columns={columns}
        dataSource={filteredCases}
        rowKey="id"
        scroll={{ x: 1000 }}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total) => `共 ${total} 条用例`,
        }}
      />

      <Modal
        title={editingCase ? '编辑测试用例' : '新建测试用例'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        width={800}
        okText="保存"
        cancelText="取消"
        className="case-detail-modal"
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={16}>
              <Form.Item
                name="title"
                label="用例标题"
                rules={[{ required: true, message: '请输入用例标题' }]}
              >
                <Input placeholder="请输入用例标题" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="priority"
                label="优先级"
                rules={[{ required: true, message: '请选择优先级' }]}
                initialValue="P2"
              >
                <Select>
                  <Option value="P0">P0 - 最高</Option>
                  <Option value="P1">P1 - 高</Option>
                  <Option value="P2">P2 - 中</Option>
                  <Option value="P3">P3 - 低</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="module"
                label="所属模块"
                rules={[{ required: true, message: '请输入所属模块' }]}
              >
                <Input placeholder="如：用户模块" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="tags" label="标签">
                <Select mode="tags" placeholder="输入标签后回车添加" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item
            name="preconditions"
            label="前置条件"
            rules={[{ required: true, message: '请输入前置条件' }]}
          >
            <TextArea rows={3} placeholder="请输入前置条件，每行一条" />
          </Form.Item>

          <Divider orientation="left">测试步骤</Divider>

          <div className="step-list">
            {steps.map((step, index) => (
              <div key={step.id} className="step-item">
                <div className="step-header">
                  <Text strong>步骤 {index + 1}</Text>
                  <Space>
                    <Button
                      size="small"
                      disabled={index === 0}
                      onClick={() => moveStep(index, 'up')}
                    >
                      上移
                    </Button>
                    <Button
                      size="small"
                      disabled={index === steps.length - 1}
                      onClick={() => moveStep(index, 'down')}
                    >
                      下移
                    </Button>
                    <Button
                      size="small"
                      danger
                      onClick={() => removeStep(step.id)}
                      disabled={steps.length === 1}
                    >
                      删除
                    </Button>
                  </Space>
                </div>
                <Row gutter={8}>
                  <Col span={12}>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      操作步骤
                    </Text>
                    <Input
                      value={step.action}
                      onChange={(e) => updateStep(step.id, 'action', e.target.value)}
                      placeholder="请输入操作步骤"
                      size="small"
                    />
                  </Col>
                  <Col span={12}>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      预期结果
                    </Text>
                    <Input
                      value={step.expected}
                      onChange={(e) => updateStep(step.id, 'expected', e.target.value)}
                      placeholder="请输入预期结果"
                      size="small"
                    />
                  </Col>
                </Row>
              </div>
            ))}
            <Button type="dashed" block icon={<PlusOutlined />} onClick={addStep}>
              添加步骤
            </Button>
          </div>
        </Form>
      </Modal>

      <Modal
        title="用例详情"
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={null}
        width={700}
      >
        {viewingCase && (
          <div>
            <Title level={4} style={{ marginBottom: 16 }}>
              {viewingCase.title}
            </Title>
            <Space style={{ marginBottom: 16 }} wrap>
              <Tag color="blue">{viewingCase.module}</Tag>
              <Tag color={viewingCase.priority === 'P0' ? 'red' : 'orange'}>
                优先级: {viewingCase.priority}
              </Tag>
              {viewingCase.tags.map((tag) => (
                <Tag key={tag}>{tag}</Tag>
              ))}
            </Space>

            <Divider orientation="left">前置条件</Divider>
            <div style={{ marginBottom: 16, whiteSpace: 'pre-wrap' }}>
              {viewingCase.preconditions}
            </div>

            <Divider orientation="left">测试步骤</Divider>
            <List
              dataSource={viewingCase.steps}
              renderItem={(step) => (
                <List.Item>
                  <List.Item.Meta
                    title={`步骤 ${step.order}`}
                    description={
                      <div>
                        <div>
                          <Text type="secondary">操作：</Text>
                          {step.action}
                        </div>
                        <div>
                          <Text type="secondary">预期：</Text>
                          {step.expected}
                        </div>
                      </div>
                    }
                  />
                </List.Item>
              )}
            />

            <Divider />
            <Text type="secondary">
              创建时间：{viewingCase.createdAt} | 更新时间：{viewingCase.updatedAt}
            </Text>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default CaseLibrary
