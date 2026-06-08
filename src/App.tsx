import { useState } from 'react'
import { Layout, Menu, Select, Avatar, Badge } from 'antd'
import {
  AppstoreOutlined,
  PlayCircleOutlined,
  DesktopOutlined,
  FileTextOutlined,
  BugOutlined,
  SettingOutlined,
  ClusterOutlined,
  BellOutlined,
  UserOutlined,
} from '@ant-design/icons'
import { useAppStore } from '@/store'
import CaseLibrary from './pages/CaseLibrary'
import SuiteOrchestration from './pages/SuiteOrchestration'
import ExecutionControl from './pages/ExecutionControl'
import DevicePool from './pages/DevicePool'
import ResultReport from './pages/ResultReport'
import DefectAssociation from './pages/DefectAssociation'
import RunSettings from './pages/RunSettings'

const { Header, Sider, Content } = Layout

type PageKey =
  | 'case-library'
  | 'suite-orchestration'
  | 'execution-control'
  | 'device-pool'
  | 'result-report'
  | 'defect-association'
  | 'run-settings'

function App() {
  const [currentPage, setCurrentPage] = useState<PageKey>('case-library')
  const { projects, currentProjectId, setCurrentProject } = useAppStore()

  const menuItems = [
    {
      key: 'case-library',
      icon: <AppstoreOutlined />,
      label: '用例库',
    },
    {
      key: 'suite-orchestration',
      icon: <ClusterOutlined />,
      label: '套件编排',
    },
    {
      key: 'execution-control',
      icon: <PlayCircleOutlined />,
      label: '执行控制',
    },
    {
      key: 'device-pool',
      icon: <DesktopOutlined />,
      label: '设备池',
    },
    {
      key: 'result-report',
      icon: <FileTextOutlined />,
      label: '结果报告',
    },
    {
      key: 'defect-association',
      icon: <BugOutlined />,
      label: '缺陷关联',
    },
    {
      key: 'run-settings',
      icon: <SettingOutlined />,
      label: '运行设置',
    },
  ]

  const renderPage = () => {
    switch (currentPage) {
      case 'case-library':
        return <CaseLibrary />
      case 'suite-orchestration':
        return <SuiteOrchestration />
      case 'execution-control':
        return <ExecutionControl />
      case 'device-pool':
        return <DevicePool />
      case 'result-report':
        return <ResultReport />
      case 'defect-association':
        return <DefectAssociation />
      case 'run-settings':
        return <RunSettings />
      default:
        return <CaseLibrary />
    }
  }

  const currentProject = projects.find((p) => p.id === currentProjectId)

  return (
    <div className="app-container">
      <Header className="app-header">
        <div className="logo">
          <PlayCircleOutlined style={{ fontSize: 24 }} />
          <span>自动化测试平台</span>
        </div>
        <div className="project-selector">
          <span>项目：</span>
          <Select
            value={currentProjectId}
            style={{ width: 200 }}
            onChange={setCurrentProject}
            options={projects.map((p) => ({ label: p.name, value: p.id }))}
          />
          <Badge count={3} size="small">
            <BellOutlined style={{ fontSize: 18, cursor: 'pointer', color: 'white' }} />
          </Badge>
          <Avatar
            size="small"
            icon={<UserOutlined />}
            style={{ marginLeft: 8, cursor: 'pointer' }}
          />
        </div>
      </Header>
      <Layout className="app-content">
        <Sider width={200} theme="dark" className="sider-menu">
          <Menu
            mode="inline"
            theme="dark"
            selectedKeys={[currentPage]}
            items={menuItems}
            onClick={({ key }) => setCurrentPage(key as PageKey)}
          />
        </Sider>
        <Content className="main-content">
          <div className="page-container">{renderPage()}</div>
        </Content>
      </Layout>
    </div>
  )
}

export default App
