import { useState } from 'react'
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
  TimePicker,
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
  EditOutlined,
} from '@ant-design/icons'
import { useAppStore } from '@/store'
import dayjs from 'dayjs'

const { Title, Text } = Typography
const { Option } = Select
const { TextArea } = Input

function RunSettings() {
  const { projects, currentProjectId, updateProjectSettings, addProject, setCurrentProject } =
    useAppStore()
  const [form] = Form.useForm()

  const currentProject = projects.find((p) => p.id === currentProjectId)
  const settings = currentProject?.settings

  const handleSave = () => {
    form.validateFields().then((values) => {
      if (currentProjectId) {
        updateProjectSettings(currentProjectId, values)
        message.success('设置保存成功')
      }
    })
  }

  const handleAddProject = () => {
    Modal.confirm({
      title: '新建项目',
      content: (
        <Form>
          <Form.Item label="项目名称" name="name">
            <Input placeholder="请输入项目名称" />
          </Form.Item>
        </Form>
      ),
      onOk: () => {
        addProject('新项目')
        message.success('项目创建成功')
      },
    })
  }

  return (
    <div>
      <div className="page-header">
        <div className="page-title">
          <SettingOutlined style={{ marginRight: 8 }} />
          运行设置
        </div>
        <Space>
          <Select
            value={currentProjectId}
            onChange={setCurrentProject}
            style={{ width: 200 }}
          >
            {projects.map((p) => (
              <Option key={p.id} value={p.id}>
                {p.name}
              </Option>
            ))}
          </Select>
          <Button icon={<PlusOutlined />} onClick={handleAddProject}>
            新建项目
          </Button>
          <Button type="primary" icon={<SaveOutlined />} onClick={handleSave}>
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
              initialValues={{
                baseUrl: settings?.baseUrl,
                defaultBrowser: settings?.defaultBrowser,
                defaultDevice: settings?.defaultDevice,
                timeout: settings?.timeout,
                retryCount: settings?.retryCount,
                screenshotOnFailure: settings?.screenshotOnFailure,
                reportPath: settings?.reportPath,
                scheduleEnabled: settings?.scheduleEnabled,
                scheduleTime: settings?.scheduleTime ? dayjs(settings.scheduleTime, 'HH:mm') : undefined,
              }}
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
            <Form form={form} layout="vertical">
              <Form.Item
                name="scheduleEnabled"
                label="启用定时执行"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="scheduleTime" label="执行时间">
                    <TimePicker format="HH:mm" style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="执行周期">
                    <Select defaultValue="daily">
                      <Option value="daily">每天</Option>
                      <Option value="weekly">每周</Option>
                      <Option value="monthly">每月</Option>
                      <Option value="cron">自定义Cron</Option>
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
                    下次执行时间：2024-01-23 09:00:00（每天）
                  </Text>
                </Space>
              </div>
            </Form>
          </Card>
        </Col>

        <Col span={8}>
          <Card size="small" title="项目列表">
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
                      item.id === currentProjectId
                        ? '1px solid #1677ff'
                        : '1px solid transparent',
                  }}
                  onClick={() => setCurrentProject(item.id)}
                  actions={[
                    <Button key="edit" type="text" size="small" icon={<EditOutlined />} />,
                    projects.length > 1 ? (
                      <Button key="delete" type="text" size="small" danger icon={<DeleteOutlined />} />
                    ) : null,
                  ].filter(Boolean)}
                >
                  <List.Item.Meta
                    title={item.name}
                    description={
                      <Tag color="blue" style={{ margin: 0 }}>
                        {item.id === currentProjectId ? '当前项目' : ''}
                      </Tag>
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
    </div>
  )
}

export default RunSettings
