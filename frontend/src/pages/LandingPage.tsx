import {useEffect, useState} from 'react'
import {Button} from '@astryxdesign/core/Button'
import {Card} from '@astryxdesign/core/Card'
import {Grid} from '@astryxdesign/core/Grid'
import {VStack} from '@astryxdesign/core/VStack'
import {HStack} from '@astryxdesign/core/HStack'
import {Text} from '@astryxdesign/core/Text'
import {Heading} from '@astryxdesign/core/Heading'
import {EmptyState} from '@astryxdesign/core/EmptyState'
import {TopNav, TopNavHeading} from '@astryxdesign/core/TopNav'
import {Dialog, DialogHeader} from '@astryxdesign/core/Dialog'
import {TextInput} from '@astryxdesign/core/TextInput'
import {Layout, LayoutContent, LayoutFooter} from '@astryxdesign/core/Layout'
import {GetProjects, AddProject, RemoveProject} from '../../wailsjs/go/main/App'
import type {main} from '../../wailsjs/go/models'

interface Props {
  onSelectProject: (path: string) => void
}

function formatDate(iso: string): string {
  if (!iso) return ''
  const d = new Date(iso)
  return d.toLocaleDateString(undefined, {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })
}

export default function LandingPage({onSelectProject}: Props) {
  const [projects, setProjects] = useState<main.ProjectRegistryEntry[]>([])
  const [showNewProject, setShowNewProject] = useState(false)
  const [newPath, setNewPath] = useState('')
  const [newName, setNewName] = useState('')

  const loadProjects = async () => {
    const list = await GetProjects()
    setProjects(list)
  }

  useEffect(() => { loadProjects() }, [])

  const handleAddProject = async () => {
    if (!newPath) return
    const entry = await AddProject(newPath)
    if (entry && entry.path) {
      loadProjects()
      setShowNewProject(false)
      setNewPath('')
      setNewName('')
    }
  }

  const handleRemove = async (path: string) => {
    await RemoveProject(path)
    loadProjects()
  }

  const handleSelectFolder = async () => {
    const dir = await pickDirectory()
    if (dir) {
      setNewPath(dir)
      if (!newName) {
        setNewName(dir.split('\\').pop() || dir.split('/').pop() || '')
      }
    }
  }

  return (
    <>
      <TopNav
        heading={<TopNavHeading heading="AI Team" />}
        endContent={<Button label="New Project" variant="primary" onClick={() => setShowNewProject(true)} />}
      />

      <div className="page-container">
        {projects.length === 0 ? (
          <EmptyState
            title="No projects yet"
            description="Create your first project to start collaborating with AI team members."
            actions={
              <Button label="New Project" variant="primary" onClick={() => setShowNewProject(true)} />
            }
          />
        ) : (
          <Grid columns={{minWidth: 320}} gap={3}>
            {projects.map((p) => (
              <Card key={p.path} variant="default" padding={3}>
                <VStack gap={2}>
                  <Heading level={3}>{p.name || 'Untitled'}</Heading>
                  <Text type="body" color="secondary">
                    {p.path}
                  </Text>
                  {p.lastOpened && (
                    <Text type="supporting" color="disabled">
                      Last opened: {formatDate(p.lastOpened)}
                    </Text>
                  )}
                  <HStack gap={2} style={{marginTop: 8}}>
                    <Button label="Open" variant="primary" onClick={() => onSelectProject(p.path)} />
                    <Button label="Remove" variant="ghost" onClick={() => handleRemove(p.path)} />
                  </HStack>
                </VStack>
              </Card>
            ))}
          </Grid>
        )}
      </div>

      {showNewProject && (
          <Dialog isOpen={showNewProject} onOpenChange={(open: boolean) => setShowNewProject(open)} width={480}>
          <Layout
            header={<DialogHeader title="Add Project" onOpenChange={(open: boolean) => setShowNewProject(open)} />}
            content={
              <LayoutContent>
                <VStack gap={3}>
                  <TextInput
                    label="Project Name"
                    value={newName}
                    onChange={(value: string) => setNewName(value)}
                  />
                  <Button label="Browse..." variant="secondary" onClick={handleSelectFolder} />
                  {newPath && (
                    <Text type="supporting" color="secondary">{newPath}</Text>
                  )}
                </VStack>
              </LayoutContent>
            }
            footer={
              <LayoutFooter hasDivider>
                <HStack gap={2} style={{justifyContent: 'flex-end'}}>
                  <Button label="Cancel" variant="secondary" onClick={() => setShowNewProject(false)} />
                  <Button label="Add" variant="primary" onClick={handleAddProject} />
                </HStack>
              </LayoutFooter>
            }
          />
        </Dialog>
      )}
    </>
  )
}

async function pickDirectory(): Promise<string | null> {
  const input = document.createElement('input')
  input.type = 'file'
  input.setAttribute('directory', '')
  input.setAttribute('webkitdirectory', '')
  return new Promise((resolve) => {
    input.onchange = () => {
      const files = input.files
      if (files && files.length > 0) {
        const file = files[0] as File & {path?: string; webkitRelativePath?: string}
        const relPath = file.webkitRelativePath || ''
        const fullPath = file.path || ''
        const root = fullPath.replace('\\' + relPath, '').replace('/' + relPath, '')
        resolve(root || fullPath)
      } else {
        resolve(null)
      }
    }
    input.click()
  })
}
