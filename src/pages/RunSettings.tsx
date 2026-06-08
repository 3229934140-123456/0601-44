import { useState, useEffect } from 'react'
import {
  Card,
  Form,
  Input,
  InputNumber,
  Select,
  Switch,
  Button,
  message,
  Typography,
  Divider,
  Row,
  Col,
  Space,
  Tag,
  Modal,
  List,
} from 'antd'
import {
  SettingOutlined,
  ClockCircleOutlined,
  SaveOutlined,
  PlusOutlined,
  AppstoreOutlined,
  DeleteOutlined,
} from '@ant-design/icons'
import { useAppStore } from '@/store'
import dayjs from 'dayjs'

const { Text } = Typography
const { Option } = Select

function RunSettings() {
  const { projects, currentProjectId, updateProjectSettings, addProject, setCurrentProject, deleteProject } =
    useAppStore()

  const [form] = Form.useForm()
  const [addModalVisible, setAddModalVisible] = useState(false)
  const [newProjectName, setNewProjectName] = useState('')
  const [isDirty, setIsDirty] = useState(false)

  const currentProject = projects.find((p) => p.id === currentProjectId)

  useEffect(() => {
    if (currentProject) {
      form.setFieldsValue({
        baseUrl: currentProject.settings.baseUrl,
        defaultBrowser: currentProject.settings.defaultBrowser,
        defaultDevice: currentProject.settings.defaultDevice,
        timeout: currentProject.settings.timeout,
        retryCount: currentProject.settings.retryCount,
        screenshotOnFailure: currentProject.settings.screenshotOnFailure,
        reportPath: currentProject.settings.reportPath,
        scheduleEnabled: currentProject.settings.scheduleEnabled,
      })
      setIsDirty(false)
    }
  }, [currentProjectId])

  const handleValuesChange = () => {
    setIsDirty(true)
  }

  const handleSave = () => {
    form.validateFields().then((values) => {
      updateProjectSettings(currentProjectId, values)
      setIsDirty(false)
      message.success('设置保存成功')
    })
  }

  const handleAddProject = () => {
    if (!newProjectName.trim()) {
      message.warning('请输入项目名称')
      return
    }
    addProject(newProjectName.trim())
    setNewProjectName('')
    setAddModalVisible(false)
    message.success('项目创建成功')
  }

  const handleSwitchProject = (id: string) => {
    if (isDirty) {
      Modal.confirm({
        title: '有未保存的更改',
        content: '当前项目的设置有未保存的更改，是否先保存？',
        okText: '保存并切换',
        cancelText: '不保存',
        onOk: () => {
          form.validateFields().then((values) => {
            updateProjectSettings(currentProjectId, values)
            setCurrentProject(id)
          })
        },
        onCancel: () => {
          setCurrentProject(id)
        },
      })
    } else {
      setCurrentProject(id)
    }
  }

  const handleDeleteProject = (id: string) => {
    if (projects.length <= 1) {
      message.warning('至少保留一个项目')
      return
    }
    deleteProject(id)
    if (currentProjectId === id) {
      const remaining = projects.filter((p) => p.id !== id)
      if (remaining.length > 0) {
        setCurrentProject(remaining[0].id)
      }
    }
    message.success('删除成功')
  }

  return (
    <div>
      <div className="page-header">
        <div className="page-title">
          <SettingOutlined style={{ marginRight: 8 }} />
          运行设置
          {isDirty && <Tag color="orange" style={{ marginLeft: 12 }}>有未保存更改</Tag>}
        </div>
        <Space>
          <Select
            value={currentProjectId}
            onChange={handleSwitchProject}
            style={{ width: 200 }}
          >
            {projects.map((p) => (
              <Option key={p.id} value={p.id}>
                {p.name}
              </Option>
            ))}
          </Select>
          <Button icon={<PlusOutlined />} onClick={() => setAddModalVisible(true)}>
            新建项目
          </Button>
          <Button type="primary" icon={<SaveOutlined />} onClick={handleSave} disabled={!isDirty}>
            保存设置
          </Button>
        </Space>
      </div>

      <Row gutter={[16, 16]}>
        <Col span={16}>
          <Card size="small" title="基本设置">
            <Form
              form={form}
              layout="vertical"
              onValuesChange={handleValuesChange}
            >
              <Form.Item
                name="baseUrl"
                label="测试环境地址"
                rules={[{ required: true, message: '请输入测试环境地址' }]}
              >
                <Input placeholder="http://localhost:3000" />
              </Form.Item>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="defaultBrowser" label="默认浏览器">
                    <Select>
                      <Option value="Chrome">Chrome</Option>
                      <Option value="Firefox">Firefox</Option>
                      <Option value="Safari">Safari</Option>
                      <Option value="Edge">Edge</Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="defaultDevice" label="默认设备">
                    <Select placeholder="选择默认设备">
                      <Option value="dev1">Chrome - Windows</Option>
                      <Option value="dev2">Firefox - Windows</Option>
                      <Option value="dev3">Safari - macOS</Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="timeout"
                    label="超时时间（毫秒）"
                    rules={[{ required: true, message: '请输入超时时间' }]}
                  >
                    <InputNumber min={1000} step={1000} style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="retryCount"
                    label="失败重试次数"
                    rules={[{ required: true, message: '请输入重试次数' }]}
                  >
                    <InputNumber min={0} max={5} style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item
                name="screenshotOnFailure"
                label="失败自动截图"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>

              <Form.Item name="reportPath" label="报告保存路径">
                <Input placeholder="./reports" />
              </Form.Item>
            </Form>
          </Card>

          <Card size="small" title="定时执行" style={{ marginTop: 16 }}>
            <Form form={form} layout="vertical" onValuesChange={handleValuesChange}>
              <Form.Item
                name="scheduleEnabled"
                label="启用定时执行"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item label="执行时间">
                    <Select defaultValue="09:00">
                      <Option value="08:00">08:00</Option>
                      <Option value="09:00">09:00</Option>
                      <Option value="12:00">12:00</Option>
                      <Option value="18:00">18:00</Option>
                      <Option value="21:00">21:00</Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="执行周期">
                    <Select defaultValue="daily">
                      <Option value="daily">每天</Option>
                      <Option value="weekly">每周</Option>
                      <Option value="monthly">每月</Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item label="执行套件">
                <Select mode="multiple" placeholder="选择要定时执行的测试套件">
                  <Option value="suite1">冒烟测试套件</Option>
                  <Option value="suite2">回归测试套件</Option>
                  <Option value="suite3">用户模块专项测试</Option>
                </Select>
              </Form.Item>

              <div
                style={{
                  padding: 12,
                  background: '#f6ffed',
                  border: '1px solid #b7eb8f',
                  borderRadius: 6,
                }}
              >
                <Space>
                  <ClockCircleOutlined style={{ color: '#52c41a' }} />
                  <Text type="success">
                    下次执行时间：{dayjs().add(1, 'day').format('YYYY-MM-DD')} 09:00:00（每天）
                  </Text>
                </Space>
              </div>
            </Form>
          </Card>
        </Col>

        <Col span={8}>
          <Card
            size="small"
            title="项目列表"
            extra={
              <Button type="link" size="small" icon={<PlusOutlined />} onClick={() => setAddModalVisible(true)}>
                新建
              </Button>
            }
          >
            <List
              size="small"
              dataSource={projects}
              renderItem={(item) => (
                <List.Item
                  style={{
                    padding: '8px 12px',
                    background: item.id === currentProjectId ? '#e6f4ff' : 'transparent',
                    borderRadius: 4,
                    marginBottom: 4,
                    cursor: 'pointer',
                    border:
                      item.id === currentProjectId ? '1px solid #1677ff' : '1px solid transparent',
                  }}
                  onClick={() => handleSwitchProject(item.id)}
                  actions={[
                    <Button
                      key="delete"
                      type="text"
                      size="small"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteProject(item.id)
                      }}
                      disabled={projects.length <= 1}
                    />,
                  ]}
                >
                  <List.Item.Meta
                    avatar={<AppstoreOutlined style={{ color: '#1677ff' }} />}
                    title={
                      <Space>
                        {item.name}
                        {item.id === currentProjectId && (
                          <Tag color="blue" style={{ margin: 0 }}>
                            当前
                          </Tag>
                        )}
                      </Space>
                    }
                    description={
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {item.settings.baseUrl}
                      </Text>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>

          <Card size="small" title="通知设置" style={{ marginTop: 16 }}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>邮件通知</span>
                <Switch defaultChecked />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>失败时通知</span>
                <Switch defaultChecked />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>执行完成通知</span>
                <Switch />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>钉钉/企业微信通知</span>
                <Switch />
              </div>
            </Space>
          </Card>

          <Card size="small" title="关于" style={{ marginTop: 16 }}>
            <div style={{ textAlign: 'center' }}>
              <SettingOutlined style={{ fontSize: 48, color: '#1677ff', marginBottom: 12 }} />
              <div style={{ fontSize: 16, fontWeight: 600 }}>自动化测试平台</div>
              <div style={{ color: '#8c8c8c', marginTop: 4 }}>版本 1.0.0</div>
              <Divider />
              <div style={{ fontSize: 12, color: '#8c8c8c' }}>
                © 2024 AutoTest Platform
                <br />
                面向测试工程师的自动化测试管理工具
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      <Modal
        title="新建项目"
        open={addModalVisible}
        onOk={handleAddProject}
        onCancel={() => setAddModalVisible(false)}
        okText="创建"
        cancelText="取消"
      >
        <div>
          <div style={{ marginBottom: 8 }}>
            <Text type="secondary">项目名称</Text>
          </div>
          <Input
            placeholder="请输入项目名称"
            value={newProjectName}
            onChange={(e) => setNewProjectName(e.target.value)}
            onPressEnter={handleAddProject}
            autoFocus
          />
          <div style={{ marginTop: 12 }}>
            <Text type="secondary" style={{ fontSize: 12 }}>
              提示：创建后将使用默认配置，您可以在后续修改各项设置。
            </Text>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default RunSettings
