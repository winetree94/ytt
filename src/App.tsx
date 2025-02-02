import { AppShell, Group } from '@mantine/core';
import { Route, Routes } from 'react-router';
import { SettingPage } from './routes/settings';
import { Text } from '@mantine/core';

function App() {
  return (
    <AppShell
      header={{ height: 60 }}
      padding="md"
    >
      <AppShell.Header>
        <Group h="100%" px="md">
          <Text>YTT</Text>
        </Group>
      </AppShell.Header>
      <AppShell.Main>
        <Routes>
          <Route path="/" element={<SettingPage />} />
        </Routes>
      </AppShell.Main>
    </AppShell>
  )
}

export default App
