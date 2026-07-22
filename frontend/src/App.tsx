import {useState} from 'react'
import {Theme} from '@astryxdesign/core'
import {neutralTheme} from '@astryxdesign/theme-neutral'
import LandingPage from './pages/LandingPage'
import ProjectPage from './pages/ProjectPage'

type View =
  | {name: 'landing'}
  | {name: 'project'; projectPath: string}

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
          />
        )}
      </div>
    </Theme>
  )
}

export default App
