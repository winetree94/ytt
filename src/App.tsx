import { AppShell, Burger, Group, NavLink } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { Route, Routes, useLocation } from 'react-router';
import { IndexPage } from './routes';
import { SettingPage } from './routes/settings';

function App() {
  const location = useLocation();
  const [opened, { toggle }] = useDisclosure();

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{ width: 300, breakpoint: 'sm', collapsed: { mobile: !opened } }}
      padding="md"
    >
      <AppShell.Header>
        <Group h="100%" px="md">
          <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
          {/* <MantineLogo size={30} /> */}
        </Group>
      </AppShell.Header>
      <AppShell.Navbar p="md">
        <NavLink
          href="/"
          label="Home"
          active={location.pathname === '/'}
          // leftSection={<IconHome2 size={16} stroke={1.5} />}
        />
        <NavLink
          href="/settings"
          label="Settings"
          active={location.pathname === '/settings'}
          // leftSection={<IconHome2 size={16} stroke={1.5} />}
        />
        {/* Navbar
        {Array(15)
          .fill(0)
          .map((_, index) => (
            <Skeleton key={index} h={28} mt="sm" animate={false} />
          ))} */}
      </AppShell.Navbar>
      <AppShell.Main>
        <Routes>
          <Route path="/" element={<IndexPage />} />
          <Route path="/settings" element={<SettingPage />} />
        </Routes>
      </AppShell.Main>
    </AppShell>
  )
}

export default App
