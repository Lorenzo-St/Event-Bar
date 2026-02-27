import app from "ags/gtk4/app"
import Gdk from "gi://Gdk"
import style from "./style.scss"
import Bar from "./widget/Bar"

const display = Gdk.Display.get_default()!
const monitorManager = display.get_monitors()

let bars = new Map<Gdk.Monitor, any>()

function addBar(monitor: Gdk.Monitor) {
  if (bars.has(monitor)) return
  const bar = Bar(monitor)
  bars.set(monitor, bar)
}

function removeBar(monitor: Gdk.Monitor) {
  const bar = bars.get(monitor)
  if (!bar) return
  bar.destroy()
  bars.delete(monitor)
}

app.start({
  css: style,

  main() {
    // Add existing monitors
    for (let i = 0; i < monitorManager.get_n_items(); i++) {
      const monitor = monitorManager.get_item(i) as Gdk.Monitor
      addBar(monitor)
    }

    // Monitor added
    monitorManager.connect("items-changed", () => {
      syncMonitors()
    })
  },
})

function syncMonitors() {
  const current = new Set<Gdk.Monitor>()

  for (let i = 0; i < monitorManager.get_n_items(); i++) {
    const monitor = monitorManager.get_item(i) as Gdk.Monitor
    current.add(monitor)

    if (!bars.has(monitor)) {
      addBar(monitor)
    }
  }

  for (const monitor of bars.keys()) {
    if (!current.has(monitor)) {
      removeBar(monitor)
    }
  }
}
