import {useState, useRef, useEffect, useCallback} from 'react'
import {Button} from '@astryxdesign/core/Button'
import {VStack} from '@astryxdesign/core/VStack'
import {HStack} from '@astryxdesign/core/HStack'
import {Text} from '@astryxdesign/core/Text'
import {Heading} from '@astryxdesign/core/Heading'
import {TopNav, TopNavHeading} from '@astryxdesign/core/TopNav'
import {Card} from '@astryxdesign/core/Card'
import {Avatar} from '@astryxdesign/core/Avatar'
import {Dialog, DialogHeader} from '@astryxdesign/core/Dialog'
import {Layout, LayoutContent, LayoutFooter} from '@astryxdesign/core/Layout'
import {
  ChatMessageList, ChatMessage, ChatMessageBubble,
  ChatComposer, ChatTokenizedText
} from '@astryxdesign/core/Chat'
import {useResizable, ResizeHandle} from '@astryxdesign/core/Resizable'
import {EndMeeting, SaveMeetingMessage} from '../../wailsjs/go/main/App'
import type {main} from '../../wailsjs/go/models'

interface Props {
  projectPath: string
  meeting: main.Meeting
  onEnd: () => void
}

function getInitials(name: string): string {
  return name.split('-').map(p => p[0]).join('').toUpperCase().slice(0, 2)
}

function formatTime(iso: string): string {
  if (!iso) return ''
  const d = new Date(iso)
  return d.toLocaleTimeString(undefined, {hour: '2-digit', minute: '2-digit'})
}

function parseMentions(text: string): string[] {
  const matches = text.match(/@(\S+)/g)
  if (!matches) return []
  return matches.map(m => m.slice(1))
}

export default function MeetingPage({projectPath, meeting, onEnd}: Props) {
  const [messages, setMessages] = useState<main.Message[]>(meeting.messages || [])
  const [input, setInput] = useState('')
  const [processing, setProcessing] = useState<Set<string>>(new Set())
  const [showEndDialog, setShowEndDialog] = useState(false)
  const [endTitle, setEndTitle] = useState('')
  const listRef = useRef<HTMLDivElement>(null)

  const sidebar = useResizable({
    defaultSize: 200,
    minSizePx: 120,
    maxSizePx: 350,
    collapsible: true,
    collapsedSize: 0,
    autoSaveId: 'meeting-sidebar',
  })

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight
    }
  }, [messages])

  const addMessage = useCallback((msg: main.Message) => {
    setMessages(prev => [...prev, msg])
    SaveMeetingMessage(projectPath, meeting.id, msg)
  }, [projectPath, meeting.id])

  const simulateAgentResponse = useCallback(async (agent: string, userMessage: string) => {
    setProcessing(prev => new Set(prev).add(agent))
    await new Promise(r => setTimeout(r, 1000 + Math.random() * 2000))

    setProcessing(prev => {
      const next = new Set(prev)
      next.delete(agent)
      return next
    })

    addMessage({
      role: 'agent',
      agentName: agent,
      content: `Good point. From a ${agent.replace('-', ' ')} perspective, I think we should consider the implications carefully. Let me analyze the key factors...`,
      timestamp: new Date().toISOString(),
    })
  }, [addMessage])

  const handleSend = useCallback(async () => {
    if (!input.trim()) return
    const text = input.trim()
    const mentions = parseMentions(text)
    const agentNames = meeting.agents || []

    const userMsg: main.Message = {
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
      mentions,
    }
    addMessage(userMsg)
    setInput('')

    const targeted = mentions.length > 0
      ? mentions.filter(m => agentNames.includes(m))
      : agentNames

    for (const agent of targeted) {
      simulateAgentResponse(agent, text)
    }
  }, [input, meeting.agents, addMessage, simulateAgentResponse])

  const handleEndMeeting = async () => {
    const title = endTitle || 'Untitled Meeting'
    await EndMeeting(projectPath, meeting.id, title)
    setShowEndDialog(false)
    onEnd()
  }

  return (
    <>
      <TopNav
        heading={<TopNavHeading heading={meeting.title || 'Meeting'} />}
        startContent={<Button label="End Meeting" variant="ghost" onClick={() => setShowEndDialog(true)} />}
        endContent={
          <Text type="supporting" color="disabled">
            {meeting.agents?.length || 0} participant{(meeting.agents?.length || 0) !== 1 ? 's' : ''}
          </Text>
        }
      />

      <div style={{flex: 1, display: 'flex', overflow: 'hidden'}}>
        <div style={{flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0}}>
          <ChatMessageList ref={listRef} style={{flex: 1, overflowY: 'auto', padding: '16px 24px'}}>
            {messages.length === 0 ? (
              <VStack gap={2} align="center" style={{padding: '40px 0'}}>
                <Text type="body" color="disabled">Meeting started. Type a message to begin.</Text>
                <Text type="supporting" color="disabled">
                  Use @mentions to address specific team members.
                </Text>
              </VStack>
            ) : (
              messages.map((msg, i) => (
                msg.role === 'user' ? (
                  <ChatMessage key={i} sender="user">
                    <ChatMessageBubble>
                      <ChatTokenizedText>{msg.content}</ChatTokenizedText>
                    </ChatMessageBubble>
                    <Text type="supporting" color="disabled" style={{fontSize: 11, marginTop: 4}}>
                      {formatTime(msg.timestamp)}
                    </Text>
                  </ChatMessage>
                ) : (
                  <ChatMessage key={i} sender="assistant" name={msg.agentName}>
                    <ChatMessageBubble variant="ghost">
                      <ChatTokenizedText>{msg.content}</ChatTokenizedText>
                    </ChatMessageBubble>
                    <Text type="supporting" color="disabled" style={{fontSize: 11, marginTop: 4}}>
                      {formatTime(msg.timestamp)}
                    </Text>
                  </ChatMessage>
                )
              ))
            )}
          </ChatMessageList>

          <ChatComposer
            value={input}
            onChange={(value: string) => setInput(value)}
            onSubmit={handleSend}
            placeholder="Type your message... Use @mention to address specific agents"
          />
        </div>

        <ResizeHandle direction="horizontal" resizable={sidebar.props} isAlwaysVisible />

        <div
          style={{
            width: sidebar.size,
            minWidth: 0,
            overflowY: 'auto',
            borderLeft: '1px solid var(--color-border-subtle)',
            padding: 16,
            flexShrink: 0,
          }}
        >
          <VStack gap={3}>
            <Heading level={4}>Participants</Heading>
            {(meeting.agents || []).map((agent) => {
              const isProcessing = processing.has(agent)
              return (
                <Card key={agent} variant={isProcessing ? 'default' : 'muted'} padding={2}>
                  <HStack gap={2} align="center">
                    <div className={isProcessing ? 'agent-processing' : ''} style={{position: 'relative'}}>
                      <Avatar name={agent} size="medium" />
                    </div>
                    <VStack gap={0.5}>
                      <Text type="body" weight="semibold" style={{fontSize: 13}}>
                        {agent}
                      </Text>
                      {isProcessing && (
                        <Text type="supporting" color="accent" style={{fontSize: 11}}>
                          thinking...
                        </Text>
                      )}
                    </VStack>
                  </HStack>
                </Card>
              )
            })}
          </VStack>
        </div>
      </div>

      {showEndDialog && (
        <Dialog isOpen={showEndDialog} onOpenChange={(open: boolean) => setShowEndDialog(open)} width={400}>
          <Layout
            header={<DialogHeader title="End Meeting" onOpenChange={(open: boolean) => setShowEndDialog(open)} />}
            content={
              <LayoutContent>
                <VStack gap={3}>
                  <Text type="body" color="secondary">
                    Give your meeting a title so you can find it later.
                  </Text>
                  <input
                    type="text"
                    placeholder="Meeting title..."
                    value={endTitle}
                    onChange={(e) => setEndTitle(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 6,
                      border: '1px solid var(--color-border)',
                      fontSize: 14,
                      fontFamily: 'inherit',
                    }}
                  />
                </VStack>
              </LayoutContent>
            }
            footer={
              <LayoutFooter hasDivider>
                <HStack gap={2} style={{justifyContent: 'flex-end'}}>
                  <Button label="Cancel" variant="secondary" onClick={() => setShowEndDialog(false)} />
                  <Button label="End Meeting" variant="destructive" onClick={handleEndMeeting} />
                </HStack>
              </LayoutFooter>
            }
          />
        </Dialog>
      )}

      <style>{`
        @keyframes pulse-ring {
          0% { box-shadow: 0 0 0 0 rgba(74, 144, 217, 0.4); }
          70% { box-shadow: 0 0 0 8px rgba(74, 144, 217, 0); }
          100% { box-shadow: 0 0 0 0 rgba(74, 144, 217, 0); }
        }
        .agent-processing {
          animation: pulse-ring 1.5s cubic-bezier(0.215, 0.61, 0.355, 1) infinite;
          border-radius: 50%;
        }
      `}</style>
    </>
  )
}
