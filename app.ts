import app from "ags/gtk4/app"
import style from "./style.scss"
import Bar from "./widget/Bar"

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
    // Create bars for existing monitors
    for (const monitor of app.get_monitors()) {
      addBar(monitor)
    }

    // Add new monitor
    app.connect("monitor-added", (_, monitor) => {
      addBar(monitor)
    })

    // Remove disconnected monitor
    app.connect("monitor-removed", (_, monitor) => {
      removeBar(monitor)
    })
  },
})
