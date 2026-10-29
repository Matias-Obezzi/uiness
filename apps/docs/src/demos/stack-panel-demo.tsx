import { BellIcon, LockIcon, MoonIcon, WifiIcon } from 'lucide-react'
import { StackPanel } from '@/components/ui/stack-panel'
import { Switch } from '@/components/ui/switch'

export default function StackPanelDemo() {
  return (
    <StackPanel
      pages={[
        {
          id: 'settings',
          title: 'Settings',
          rows: [
            { id: 'wifi', label: 'Wi-Fi', icon: <WifiIcon />, detail: 'Home', to: 'wifi' },
            {
              id: 'notifications',
              label: 'Notifications',
              icon: <BellIcon />,
              to: 'notifications',
            },
            { id: 'privacy', label: 'Privacy', icon: <LockIcon />, to: 'privacy' },
            { id: 'focus', label: 'Focus', icon: <MoonIcon />, detail: 'Off' },
          ],
        },
        {
          id: 'wifi',
          title: 'Wi-Fi',
          rows: [
            { id: 'home', label: 'Home', detail: 'Connected' },
            { id: 'office', label: 'Office', to: 'office' },
            { id: 'cafe', label: 'Café Lumen' },
          ],
        },
        {
          id: 'office',
          title: 'Office',
          content: (
            <p className="px-1 text-muted-foreground text-sm">
              Saved network · WPA3 · joins on its own.
            </p>
          ),
        },
        {
          id: 'notifications',
          title: 'Notifications',
          content: (
            <div className="flex items-center justify-between rounded-xl border bg-background px-3 py-2.5 text-sm">
              <span id="previews-label">Show previews</span>
              <Switch defaultChecked aria-labelledby="previews-label" />
            </div>
          ),
        },
        {
          id: 'privacy',
          title: 'Privacy',
          rows: [
            { id: 'location', label: 'Location services', detail: 'On' },
            { id: 'tracking', label: 'Tracking', detail: 'Off' },
          ],
        },
      ]}
    />
  )
}
