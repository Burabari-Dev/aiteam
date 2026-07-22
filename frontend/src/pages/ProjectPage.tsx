import {useEffect, useState} from 'react'
import {Button} from '@astryxdesign/core/Button'
import {Card} from '@astryxdesign/core/Card'
import {VStack} from '@astryxdesign/core/VStack'
import {HStack} from '@astryxdesign/core/HStack'
import {Text} from '@astryxdesign/core/Text'
import {Heading} from '@astryxdesign/core/Heading'
import {TopNav, TopNavHeading} from '@astryxdesign/core/TopNav'
import {EmptyState} from '@astryxdesign/core/EmptyState'
import {GetProjectMeta, ListMeetings, GetTeamRoles} from '../../wailsjs/go/main/App'
import type {main} from '../../wailsjs/go/models'

interface Props {
  projectPath: string
  onBack: () => void
}

function formatDate(iso: string): string {
  if (!iso) return ''
  const d = new Date(iso)
  return d.toLocaleDateString(undefined, {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })
}

export default function ProjectPage({projectPath, onBack}: Props) {
  const [meta, setMeta] = useState<main.ProjectMeta | null>(null)
  const [meetings, setMeetings] = useState<main.MeetingSummary[]>([])
  const [roles, setRoles] = useState<string[]>([])

  const load = async () => {
    const m = await GetProjectMeta(projectPath)
    setMeta(m)
    const ms = await ListMeetings(projectPath)
    const sorted = [...ms].sort((a, b) => b.startedAt.localeCompare(a.startedAt))
    setMeetings(sorted)
    const r = await GetTeamRoles(projectPath)
    setRoles(r)
  }

  useEffect(() => { load() }, [projectPath])

  return (
    <>
      <TopNav
        heading={<TopNavHeading heading={meta?.name || 'Project'} />}
        startContent={<Button label="Back" variant="ghost" onClick={onBack} />}
        endContent={<Button label="Start New Meeting" variant="primary" onClick={() => {}} />}
      />

      <div className="page-container">
        <VStack gap={4}>
          {meta?.description && (
            <Text type="body" color="secondary">{meta.description}</Text>
          )}

          <Card padding={3}>
            <VStack gap={2}>
              <Heading level={3}>Team</Heading>
              {roles.length === 0 ? (
                <Text type="body" color="disabled">No team roles configured yet.</Text>
              ) : (
                <HStack gap={2} wrap="wrap">
                  {roles.map((role) => (
                    <Card key={role} variant="muted" padding={1.5}>
                      <Text type="body">{role}</Text>
                    </Card>
                  ))}
                </HStack>
              )}
            </VStack>
          </Card>

          <Card padding={3}>
            <VStack gap={2}>
              <Heading level={3}>Past Meetings</Heading>
              {meetings.length === 0 ? (
                <EmptyState
                  title="No meetings yet"
                  description="Start a meeting to collaborate with your AI team."
                  isCompact
                />
              ) : (
                <VStack gap={2}>
                  {meetings.map((m) => (
                    <Card key={m.id} variant="muted" padding={2}>
                      <HStack gap={3} align="center" style={{justifyContent: 'space-between'}}>
                        <VStack gap={0.5}>
                          <Text type="body" weight="semibold">{m.title}</Text>
                          <Text type="supporting" color="disabled">
                            {formatDate(m.startedAt)} &middot; {m.agentCount} agent{m.agentCount !== 1 ? 's' : ''}
                          </Text>
                        </VStack>
                        <Button label="Resume" variant="secondary" size="sm" onClick={() => {}} />
                      </HStack>
                    </Card>
                  ))}
                </VStack>
              )}
            </VStack>
          </Card>
        </VStack>
      </div>
    </>
  )
}
