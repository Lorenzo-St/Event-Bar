import app from "ags/gtk4/app"
import style from "./style.scss"
import Bar from "./widget/Bar"

let bars = new Map<number, any>()

function recreateBars() {
  // Destroy tracked bars
  for (const bar of bars.values()) {
    bar.destroy()
  }
  bars.clear()

  // Recreate bars inside AGS tracking context
  for (const monitor of app.get_monitors()) {
    const bar = Bar(monitor)
    bars.set(monitor.id, bar)
  }
}

app.start({
  css: style,

  main() {
    recreateBars()

    // app.connect("monitor-added", recreateBars)
    // app.connect("monitor-removed", recreateBars)
  },
})
