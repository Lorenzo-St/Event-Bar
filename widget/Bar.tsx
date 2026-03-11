import app from "ags/gtk4/app"

import { Astal, Gtk, Gdk } from "ags/gtk4"
import { createPoll } from "ags/time"
import { onCleanup } from "gnim"
import AstalBattery from "gi://AstalBattery"
import AstalNetwork from "gi://AstalNetwork"
import AstalWp from "gi://AstalWp"

import { For, With, createBinding } from "ags"
import { execAsync } from "ags/process"

function BatteryIndicator() {

	const batteryDevice = AstalBattery.get_default();

	const batteryPercent = createBinding(batteryDevice, "percentage")
	const batteryIcon = createBinding(batteryDevice, "battery-icon-name")
	onCleanup(() => {
		batteryPercent.unsubscribe();
		batteryIcon.unsubscribe();
	});

	let content;
	content = <label cssName="text" label={batteryPercent(
		(p) => {
			return `${Math.round(p * 100)}%`
		}
	)} />


	return <box class="node-background" $type="start" halign={Gtk.Align.LEFT}>
		<menubutton class="node-background">
			<box>
				<image icon-name={batteryIcon((p) => p)} />

				{content}
			</box>
		</menubutton>
	</box >
}


function TimeDateCalendar() {
	const time = createPoll("", 1000, "date")
	onCleanup(() => {
		time.unsubscribe();
	});


	return <box $type="center" halign={Gtk.Align.CENTER}>
		<menubutton class="CalendarButton" halign={Gtk.Align.CENTER}>
			<box halign={Gtk.Align.CENTER}>
				<label cssName="text" label={time} />
			</box>
			<popover>
				<Gtk.Calendar />
			</popover>
		</menubutton>
	</box>
}



function NetAudioBluetooth() {
	const network = AstalNetwork.get_default();
	console.log(network.get_primary());
	const wifi = createBinding(network, "wifi")

	const { defaultSpeaker: speaker } = AstalWp.get_default()!


	const networkAlign = Gtk.Align.LEFT;
	const audioAlign = Gtk.Align.CENTER;

	async function connect(ap: AstalNetwork.AccessPoint) {
		try {
			await execAsync(`nmcli d wifi connect ${ap.bssid}`)
		} catch (error) {
			// you can implement a popup asking for password here
			console.error(error)
		}
	}
	const sorted = (arr: Array<AstalNetwork.AccessPoint>) => {
		return arr.filter((ap) => !!ap.ssid).sort((a, b) => b.strength - a.strength)
	}
	let networkContent = <box visible={wifi(Boolean)} halign={networkAlign}>
		<With value={wifi}>
			{(wifi) => wifi && (
				<menubutton class="node-background">
					<image icon-name={createBinding(wifi, "iconName")} />
					<popover>
						(<For each={createBinding(wifi, "accessPoints")(sorted)}>
							{(ap: AstalNetwork.AccessPoint) => (
								<button onClicked={() => connect(ap)}>
									<box spacing={4}>
										<image iconName={createBinding(ap, "iconName")} />
										<label label={createBinding(ap, "ssid")} />
										<image
											iconName="object-select-symbolic"
											visible={createBinding(
												wifi,
												"activeAccessPoint",
											)((active) => active === ap)}
										/>
									</box>
								</button>
							)}
						</For>)
					</popover>
				</menubutton>)}
		</With>
	</box >

	let audioContent = <box halign={audioAlign}>
		<menubutton class="node-background">
			<image icon-name={createBinding(speaker, "volumeIcon")} />
			<popover>
				<box>
					<slider
						widthRequest={260}
						onChangeValue={({ value }) => speaker.set_volume(value)}
						value={createBinding(speaker, "volume")}
					/>
				</box>
			</popover>
		</menubutton>
	</box>



	return <box $type="end" halign={Gtk.Align.RIGHT}>
		{networkContent}
		{audioContent}
	</box>

}



export default function Bar(gdkmonitor: Gdk.Monitor) {

	const { TOP, LEFT, RIGHT } = Astal.WindowAnchor

	const widget = (
		<window
			visible
			name="bar"
			class="Bar"
			gdkmonitor={gdkmonitor}
			exclusivity={Astal.Exclusivity.EXCLUSIVE}
			anchor={TOP | LEFT | RIGHT}
			application={app}
		>
			<centerbox cssName="centerbox">
				<BatteryIndicator />
				<TimeDateCalendar />
				<NetAudioBluetooth />
			</centerbox>
		</window>
	)

	return { widget }
}
