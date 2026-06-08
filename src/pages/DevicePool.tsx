import { useState } from 'react'
import {
  Card,
  Row,
  Col,
  Button,
  Tag,
  Space,
  Modal,
  Form,
  Input,
  Select,
  message,
  Popconfirm,
  Typography,
  Statistic,
  Divider,
} from 'antd'
import {
  DesktopOutlined,
  MobileOutlined,
  GlobalOutlined,
  PlusOutlined,
  DeleteOutlined,
  EditOutlined,
  ReloadOutlined,
  AppstoreOutlined,
} from '@ant-design/icons'
import { useAppStore } from '@/store'
import type { Device } from '@/types'

const { Title, Text } = Typography
const { Option } = Select

function DevicePool() {
  const { devices, addDevice, updateDevice, deleteDevice } = useAppStore()
  const [modalVisible, setModalVisible] = useState(false)
  const [editingDevice, setEditingDevice] = useState<Device | null>(null)
  const [form] = Form.useForm()

  const idleCount = devices.filter((d) => d.status === 'idle').length
  const runningCount = devices.filter((d) => d.status === 'running').length
  const offlineCount = devices.filter((d) => d.status === 'offline').length
  const busyCount = devices.filter((d) => d.status === 'busy').length

  const handleAdd = () => {
    setEditingDevice(null)
    form.resetFields()
    setModalVisible(true)
  }

  const handleEdit = (device: Device) => {
    setEditingDevice(device)
    form.setFieldsValue(device)
    setModalVisible(true)
  }

  const handleSubmit = () => {
    form.validateFields().then((values) => {
      if (editingDevice) {
        updateDevice(editingDevice.id, values)
        message.success('更新成功')
      } else {
        addDevice({
          ...values,
          status: 'idle',
        })
        message.success('添加成功')
      }
      setModalVisible(false)
    })
  }

  const handleDelete = (id: string) => {
    deleteDevice(id)
    message.success('删除成功')
  }

  const getDeviceIcon = (type: string) => {
    switch (type) {
      case 'browser':
        return <GlobalOutlined style={{ fontSize: 32, color: '#1677ff' }} />
      case 'mobile':
        return <MobileOutlined style={{ fontSize: 32, color: '#52c41a' }} />
      case 'desktop':
        return <DesktopOutlined style={{ fontSize: 32, color: '#faad14' }} />
      default:
        return <DesktopOutlined style={{ fontSize: 32 }} />
    }
  }

  const getStatusText = (status: string) => {
    const map: Record<string, { text: string; color: string }> = {
      idle: { text: '空闲', color: 'success' },
      running: { text: '运行中', color: 'processing' },
      offline: { text: '离线', color: 'error' },
      busy: { text: '繁忙', color: 'warning' },
    }
    return map[status] || { text: status, color: 'default' }
  }

  const browserDevices = devices.filter((d) => d.type === 'browser')
  const mobileDevices = devices.filter((d) => d.type === 'mobile')

  return (
    <div>
      <div className="page-header">
        <div className="page-title">
          <DesktopOutlined style={{ marginRight: 8 }} />
          设备池管理
        </div>
        <Space>
          <Button icon={<ReloadOutlined />}>刷新状态</Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            添加设备
          </Button>
        </Space>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="设备总数"
              value={devices.length}
              prefix={<DesktopOutlined />}
              valueStyle={{ color: '#1677ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="空闲设备"
              value={idleCount}
              prefix={<span style={{ color: '#52c41a' }}>●</span>}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="运行中"
              value={runningCount}
              prefix={<span style={{ color: '#1677ff' }}>●</span>}
              valueStyle={{ color: '#1677ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="离线"
              value={offlineCount}
              prefix={<span style={{ color: '#ff4d4f' }}>●</span>}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
      </Row>

      <Divider orientation="left">浏览器设备</Divider>
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        {browserDevices.map((device) => (
          <Col span={8} key={device.id}>
            <Card className={`device-card status-${device.status}`}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <div style={{ paddingTop: 4 }}>{getDeviceIcon(device.type)}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text strong>{device.name}</Text>
                    <Tag color={getStatusText(device.status).color}>
                      {getStatusText(device.status).text}
                    </Tag>
                  </div>
                  <div style={{ marginTop: 8, fontSize: 13, color: '#8c8c8c' }}>
                    <div>浏览器: {device.browserName || '-'}</div>
                    <div>版本: {device.version}</div>
                    <div>系统: {device.os || '-'}</div>
                  </div>
                  <Space style={{ marginTop: 12 }}>
                    <Button size="small" icon={<EditOutlined />} onClick={() => handleEdit(device)}>
                      编辑
                    </Button>
                    <Popconfirm title="确定删除该设备？" onConfirm={() => handleDelete(device.id)}>
                      <Button size="small" danger icon={<DeleteOutlined />}>
                        删除
                      </Button>
                    </Popconfirm>
                  </Space>
                </div>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      <Divider orientation="left">移动设备</Divider>
      <Row gutter={[16, 16]}>
        {mobileDevices.map((device) => (
          <Col span={8} key={device.id}>
            <Card className={`device-card status-${device.status}`}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <div style={{ paddingTop: 4 }}>{getDeviceIcon(device.type)}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text strong>{device.name}</Text>
                    <Tag color={getStatusText(device.status).color}>
                      {getStatusText(device.status).text}
                    </Tag>
                  </div>
                  <div style={{ marginTop: 8, fontSize: 13, color: '#8c8c8c' }}>
                    <div>平台: {device.platform}</div>
                    <div>版本: {device.version}</div>
                    <div>IP: {device.ip || '-'}</div>
                  </div>
                  <Space style={{ marginTop: 12 }}>
                    <Button size="small" icon={<EditOutlined />} onClick={() => handleEdit(device)}>
                      编辑
                    </Button>
                    <Popconfirm title="确定删除该设备？" onConfirm={() => handleDelete(device.id)}>
                      <Button size="small" danger icon={<DeleteOutlined />}>
                        删除
                      </Button>
                    </Popconfirm>
                  </Space>
                </div>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      <Modal
        title={editingDevice ? '编辑设备' : '添加设备'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        okText="保存"
        cancelText="取消"
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="设备名称"
            rules={[{ required: true, message: '请输入设备名称' }]}
          >
            <Input placeholder="请输入设备名称" />
          </Form.Item>
          <Form.Item
            name="type"
            label="设备类型"
            rules={[{ required: true, message: '请选择设备类型' }]}
          >
            <Select>
              <Option value="browser">浏览器</Option>
              <Option value="mobile">移动设备</Option>
              <Option value="desktop">桌面应用</Option>
            </Select>
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="platform"
                label="平台"
                rules={[{ required: true, message: '请选择平台' }]}
              >
                <Select>
                  <Option value="Windows">Windows</Option>
                  <Option value="macOS">macOS</Option>
                  <Option value="iOS">iOS</Option>
                  <Option value="Android">Android</Option>
                  <Option value="Linux">Linux</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="version"
                label="版本"
                rules={[{ required: true, message: '请输入版本' }]}
              >
                <Input placeholder="如：120.0" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="browserName" label="浏览器名称">
            <Input placeholder="如：Chrome / Firefox / Safari" />
          </Form.Item>
          <Form.Item name="os" label="操作系统">
            <Input placeholder="如：Windows 11 / iOS 17" />
          </Form.Item>
          <Form.Item name="ip" label="IP地址">
            <Input placeholder="移动设备请填写IP地址" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default DevicePool
