import {useState} from 'react'
import {Theme} from '@astryxdesign/core'
import {neutralTheme} from '@astryxdesign/theme-neutral'
import LandingPage from './pages/LandingPage'
import ProjectPage from './pages/ProjectPage'
import MeetingPage from './pages/MeetingPage'

type View =
  | {name: 'landing'}
  | {name: 'project'; projectPath: string}
  | {name: 'meeting'; projectPath: string; meeting: main.Meeting}

import type {main} from '../wailsjs/go/models'

function App() {
  const [view, setView] = useState<View>({name: 'landing'})

  return (
    <Theme theme={neutralTheme}>
      <div id="app">
        {view.name === 'landing' && (
          <LandingPage
            onSelectProject={(path) => setView({name: 'project', projectPath: path})}
          />
        )}
        {view.name === 'project' && (
          <ProjectPage
            projectPath={view.projectPath}
            onBack={() => setView({name: 'landing'})}
            onStartMeeting={(meeting) => setView({name: 'meeting', projectPath: view.projectPath, meeting})}
          />
        )}
        {view.name === 'meeting' && (
          <MeetingPage
            projectPath={view.projectPath}
            meeting={view.meeting}
            onEnd={() => setView({name: 'project', projectPath: view.projectPath})}
          />
        )}
      </div>
    </Theme>
  )
}

export default App
