import { useState } from 'react'
import {
  Card,
  Row,
  Col,
  Input,
  Button,
  Tag,
  Space,
  Modal,
  Form,
  message,
  Popconfirm,
  List,
  Typography,
  Empty,
  Select,
  Divider,
} from 'antd'
import {
  PlusOutlined,
  DeleteOutlined,
  EditOutlined,
  PlayCircleOutlined,
  SearchOutlined,
  HolderOutlined,
  AppstoreOutlined,
} from '@ant-design/icons'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
  useDroppable,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useAppStore } from '@/store'
import type { TestCase, TestSuite } from '@/types'
import { CSSProperties } from 'react'

const { Title, Text } = Typography
const { TextArea } = Input
const { Option } = Select

interface SortableCaseItemProps {
  caseData: TestCase
  onRemove?: () => void
  showRemove?: boolean
}

function SortableCaseItem({ caseData, onRemove, showRemove }: SortableCaseItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: caseData.id,
  })

  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1000 : 1,
  }

  return (
    <div ref={setNodeRef} style={style} className="draggable-case-item">
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span className="drag-handle" {...attributes} {...listeners}>
          <HolderOutlined />
        </span>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 500, marginBottom: 4 }}>{caseData.title}</div>
          <Space size="small">
            <Tag color="blue" style={{ margin: 0 }}>
              {caseData.module}
            </Tag>
            <span className={`priority-tag-${caseData.priority}`} style={{ fontSize: 12 }}>
              {caseData.priority}
            </span>
          </Space>
        </div>
        {showRemove && onRemove && (
          <Button
            type="text"
            danger
            size="small"
            icon={<DeleteOutlined />}
            onClick={(e) => {
              e.stopPropagation()
              onRemove()
            }}
          />
        )}
      </div>
    </div>
  )
}

interface DroppableCanvasProps {
  children: React.ReactNode
  isOver: boolean
  isEmpty: boolean
}

function DroppableCanvas({ children, isOver, isEmpty }: DroppableCanvasProps) {
  const { setNodeRef } = useDroppable({
    id: 'suite-canvas',
  })

  return (
    <div
      ref={setNodeRef}
      className={`suite-canvas ${isOver ? 'drag-over' : ''}`}
      style={{
        minHeight: isEmpty ? 200 : 'auto',
        background: isOver ? '#e6f4ff' : '#fafafa',
        borderColor: isOver ? '#1677ff' : '#d9d9d9',
      }}
    >
      {children}
    </div>
  )
}

function SuiteOrchestration() {
  const { cases, suites, addSuite, updateSuite, deleteSuite, reorderSuiteCases, getCaseById } =
    useAppStore()

  const [selectedSuiteId, setSelectedSuiteId] = useState<string | null>(
    suites.length > 0 ? suites[0].id : null
  )
  const [searchKeyword, setSearchKeyword] = useState('')
  const [selectedTag, setSelectedTag] = useState<string>('')
  const [modalVisible, setModalVisible] = useState(false)
  const [editingSuite, setEditingSuite] = useState<TestSuite | null>(null)
  const [form] = Form.useForm()
  const [activeId, setActiveId] = useState<string | null>(null)
  const [isOverCanvas, setIsOverCanvas] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const selectedSuite = suites.find((s) => s.id === selectedSuiteId)
  const suiteCases = selectedSuite
    ? selectedSuite.caseIds
        .map((id) => getCaseById(id))
        .filter((c): c is TestCase => c !== undefined)
    : []

  const allTags = Array.from(new Set(cases.flatMap((c) => c.tags)))

  const availableCases = cases.filter((c) => {
    const notInSuite = !selectedSuite?.caseIds.includes(c.id)
    const matchKeyword =
      !searchKeyword ||
      c.title.toLowerCase().includes(searchKeyword.toLowerCase()) ||
      c.module.toLowerCase().includes(searchKeyword.toLowerCase())
    const matchTag = !selectedTag || c.tags.includes(selectedTag)
    return notInSuite && matchKeyword && matchTag
  })

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragOver = (event: any) => {
    const { over } = event
    if (over && over.id === 'suite-canvas') {
      setIsOverCanvas(true)
    } else {
      setIsOverCanvas(false)
    }
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)
    setIsOverCanvas(false)

    if (!selectedSuiteId) {
      message.warning('请先选择或创建一个测试套件')
      return
    }

    const activeIdStr = active.id as string

    if (!over) {
      return
    }

    const isInSuite = selectedSuite?.caseIds.includes(activeIdStr)
    const overId = over.id as string

    if (overId === 'suite-canvas') {
      if (!isInSuite) {
        const suite = suites.find((s) => s.id === selectedSuiteId)
        if (suite) {
          reorderSuiteCases(selectedSuiteId, [...suite.caseIds, activeIdStr])
          message.success('已添加到套件')
        }
      }
      return
    }

    const isTargetInSuite = selectedSuite?.caseIds.includes(overId)

    if (isInSuite && isTargetInSuite) {
      const oldIndex = selectedSuite!.caseIds.indexOf(activeIdStr)
      const newIndex = selectedSuite!.caseIds.indexOf(overId)
      const newCaseIds = arrayMove(selectedSuite!.caseIds, oldIndex, newIndex)
      reorderSuiteCases(selectedSuiteId, newCaseIds)
    } else if (!isInSuite && isTargetInSuite) {
      const suite = suites.find((s) => s.id === selectedSuiteId)
      if (suite) {
        const newCaseIds = [...suite.caseIds]
        const insertIndex = newCaseIds.indexOf(overId)
        newCaseIds.splice(insertIndex, 0, activeIdStr)
        reorderSuiteCases(selectedSuiteId, newCaseIds)
        message.success('已添加到套件')
      }
    }
  }

  const handleAddToSuite = (caseId: string) => {
    if (!selectedSuiteId) {
      message.warning('请先选择或创建一个测试套件')
      return
    }
    const suite = suites.find((s) => s.id === selectedSuiteId)
    if (suite) {
      reorderSuiteCases(selectedSuiteId, [...suite.caseIds, caseId])
      message.success('已添加到套件')
    }
  }

  const handleRemoveFromSuite = (caseId: string) => {
    if (!selectedSuiteId) return
    const suite = suites.find((s) => s.id === selectedSuiteId)
    if (suite) {
      reorderSuiteCases(
        selectedSuiteId,
        suite.caseIds.filter((id) => id !== caseId)
      )
    }
  }

  const handleAddSuite = () => {
    setEditingSuite(null)
    form.resetFields()
    setModalVisible(true)
  }

  const handleEditSuite = (suite: TestSuite) => {
    setEditingSuite(suite)
    form.setFieldsValue({
      name: suite.name,
      description: suite.description,
    })
    setModalVisible(true)
  }

  const handleSubmitSuite = () => {
    form.validateFields().then((values) => {
      if (editingSuite) {
        updateSuite(editingSuite.id, values)
        message.success('更新成功')
      } else {
        addSuite({
          ...values,
          caseIds: [],
        })
        message.success('创建成功')
      }
      setModalVisible(false)
    })
  }

  const handleDeleteSuite = (id: string) => {
    deleteSuite(id)
    if (selectedSuiteId === id) {
      const remaining = suites.filter((s) => s.id !== id)
      setSelectedSuiteId(remaining.length > 0 ? remaining[0].id : null)
    }
    message.success('删除成功')
  }

  const activeCase = activeId ? getCaseById(activeId) : null

  const renderAvailableCase = (caseItem: TestCase) => (
    <div key={caseItem.id} style={{ position: 'relative' }}>
      <SortableCaseItem caseData={caseItem} />
      <Button
        type="primary"
        size="small"
        style={{
          position: 'absolute',
          right: 8,
          top: '50%',
          transform: 'translateY(-50%)',
        }}
        onClick={() => handleAddToSuite(caseItem.id)}
      >
        添加
      </Button>
    </div>
  )

  return (
    <div>
      <div className="page-header">
        <div className="page-title">
          <AppstoreOutlined style={{ marginRight: 8 }} />
          套件编排
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAddSuite}>
          新建套件
        </Button>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <Row gutter={[16, 16]}>
          <Col span={6}>
            <Card
              size="small"
              title="测试套件"
              extra={
                <Button type="link" size="small" icon={<PlusOutlined />} onClick={handleAddSuite}>
                  新建
                </Button>
              }
              style={{ height: '100%' }}
            >
              {suites.length === 0 ? (
                <Empty description="暂无套件" />
              ) : (
                <List
                  size="small"
                  dataSource={suites}
                  renderItem={(suite) => (
                    <List.Item
                      key={suite.id}
                      style={{
                        cursor: 'pointer',
                        padding: '8px 12px',
                        background: selectedSuiteId === suite.id ? '#e6f4ff' : 'transparent',
                        borderRadius: 4,
                        marginBottom: 4,
                        border:
                          selectedSuiteId === suite.id
                            ? '1px solid #1677ff'
                            : '1px solid transparent',
                      }}
                      onClick={() => setSelectedSuiteId(suite.id)}
                      actions={[
                        <Button
                          key="edit"
                          type="text"
                          size="small"
                          icon={<EditOutlined />}
                          onClick={(e) => {
                            e.stopPropagation()
                            handleEditSuite(suite)
                          }}
                        />,
                        <Popconfirm
                          key="delete"
                          title="确定删除该套件？"
                          onConfirm={(e) => {
                            e?.stopPropagation()
                            handleDeleteSuite(suite.id)
                          }}
                        >
                          <Button
                            type="text"
                            size="small"
                            danger
                            icon={<DeleteOutlined />}
                            onClick={(e) => e.stopPropagation()}
                          />
                        </Popconfirm>,
                      ]}
                    >
                      <List.Item.Meta
                        title={suite.name}
                        description={
                          <Text type="secondary" ellipsis>
                            {suite.caseIds.length} 个用例
                          </Text>
                        }
                      />
                    </List.Item>
                  )}
                />
              )}
            </Card>
          </Col>

          <Col span={9}>
            <Card size="small" title="可用用例" style={{ height: '100%' }}>
              <Space direction="vertical" style={{ width: '100%', marginBottom: 12 }} size="small">
                <Input
                  placeholder="搜索用例..."
                  prefix={<SearchOutlined />}
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  allowClear
                  size="small"
                />
                <Select
                  placeholder="按标签筛选"
                  value={selectedTag || undefined}
                  onChange={setSelectedTag}
                  allowClear
                  size="small"
                  style={{ width: '100%' }}
                >
                  {allTags.map((tag) => (
                    <Option key={tag} value={tag}>
                      {tag}
                    </Option>
                  ))}
                </Select>
              </Space>
              <div
                style={{
                  maxHeight: 'calc(100vh - 280px)',
                  overflowY: 'auto',
                  paddingRight: 4,
                }}
              >
                {availableCases.length === 0 ? (
                  <Empty description="暂无可添加用例" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                ) : (
                  <SortableContext
                    items={availableCases.map((c) => c.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {availableCases.map((caseItem) => renderAvailableCase(caseItem))}
                  </SortableContext>
                )}
              </div>
            </Card>
          </Col>

          <Col span={9}>
            <Card
              size="small"
              title={
                selectedSuite
                  ? `${selectedSuite.name} (${suiteCases.length} 个用例)`
                  : '套件画布'
              }
              extra={
                selectedSuite && suiteCases.length > 0 && (
                  <Button type="primary" size="small" icon={<PlayCircleOutlined />}>
                    执行
                  </Button>
                )
              }
            >
              {!selectedSuite ? (
                <div className="empty-suite-tip">
                  <AppstoreOutlined style={{ fontSize: 48, marginBottom: 12 }} />
                  <Text type="secondary">请选择或创建一个测试套件</Text>
                </div>
              ) : (
                <DroppableCanvas isOver={isOverCanvas} isEmpty={suiteCases.length === 0}>
                  {suiteCases.length === 0 ? (
                    <div className="empty-suite-tip" style={{ height: 150 }}>
                      <Text type="secondary">拖拽左侧用例到此处添加</Text>
                      <Text type="secondary" style={{ fontSize: 12, marginTop: 4 }}>
                        或点击用例右侧的"添加"按钮
                      </Text>
                    </div>
                  ) : (
                    <SortableContext
                      items={suiteCases.map((c) => c.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      {suiteCases.map((caseItem) => (
                        <SortableCaseItem
                          key={caseItem.id}
                          caseData={caseItem}
                          showRemove
                          onRemove={() => handleRemoveFromSuite(caseItem.id)}
                        />
                      ))}
                    </SortableContext>
                  )}
                </DroppableCanvas>
              )}

              {selectedSuite && (
                <>
                  <Divider style={{ margin: '16px 0' }} />
                  <div>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      套件描述
                    </Text>
                    <div style={{ fontSize: 13, color: '#595959', marginTop: 4 }}>
                      {selectedSuite.description || '暂无描述'}
                    </div>
                  </div>
                  <div style={{ marginTop: 12 }}>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      统计信息
                    </Text>
                    <Row gutter={[8, 8]} style={{ marginTop: 8 }}>
                      <Col span={8}>
                        <div style={{ fontSize: 18, fontWeight: 600, color: '#1677ff' }}>
                          {suiteCases.length}
                        </div>
                        <div style={{ fontSize: 12, color: '#8c8c8c' }}>总用例</div>
                      </Col>
                      <Col span={8}>
                        <div style={{ fontSize: 18, fontWeight: 600, color: '#ff4d4f' }}>
                          {suiteCases.filter((c) => c.priority === 'P0').length}
                        </div>
                        <div style={{ fontSize: 12, color: '#8c8c8c' }}>P0 用例</div>
                      </Col>
                      <Col span={8}>
                        <div style={{ fontSize: 18, fontWeight: 600, color: '#52c41a' }}>
                          {suiteCases.filter((c) => c.priority === 'P1').length}
                        </div>
                        <div style={{ fontSize: 12, color: '#8c8c8c' }}>P1 用例</div>
                      </Col>
                    </Row>
                  </div>
                </>
              )}
            </Card>
          </Col>
        </Row>

        <DragOverlay>
          {activeCase ? (
            <div
              className="draggable-case-item"
              style={{
                boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
                transform: 'rotate(2deg)',
                background: 'white',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="drag-handle">
                  <HolderOutlined />
                </span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 500, marginBottom: 4 }}>{activeCase.title}</div>
                  <Space size="small">
                    <Tag color="blue" style={{ margin: 0 }}>
                      {activeCase.module}
                    </Tag>
                    <span className={`priority-tag-${activeCase.priority}`} style={{ fontSize: 12 }}>
                      {activeCase.priority}
                    </span>
                  </Space>
                </div>
              </div>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      <Modal
        title={editingSuite ? '编辑测试套件' : '新建测试套件'}
        open={modalVisible}
        onOk={handleSubmitSuite}
        onCancel={() => setModalVisible(false)}
        okText="保存"
        cancelText="取消"
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="套件名称"
            rules={[{ required: true, message: '请输入套件名称' }]}
          >
            <Input placeholder="请输入套件名称" />
          </Form.Item>
          <Form.Item name="description" label="套件描述">
            <TextArea rows={3} placeholder="请输入套件描述" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default SuiteOrchestration
