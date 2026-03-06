import app from "ags/gtk4/app"

import { Astal, Gtk, Gdk } from "ags/gtk4"
import { createPoll } from "ags/time"
import { Variable } from "ags"
import { onCleanup } from "gnim"
import AstalBattery from "gi://AstalBattery"
import AstalNetwork from "gi://AstalNetwork"
import AstalWp from "gi://AstalWp"

import { createBinding } from "ags"

function BatteryIndicator({ subscriptions }: { subscriptions: any[] }) {

	const batteryDevice = AstalBattery.get_default();

	const batteryPercent = createBinding(batteryDevice, "percentage")
	const batteryIcon = createBinding(batteryDevice, "battery-icon-name")
	subscriptions.push(batteryPercent, batteryIcon);

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


function TimeDateCalendar({ subscriptions }: { subscriptions: any[] }) {
	const time = createPoll("", 1000, "date")
	subscriptions.push(time);


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

function NetworkDropdown({ subscriptions }: { subscriptions: any[] }) {
	const network = AstalNetwork.get_default();
	const wifi = network.get_wifi();
	const accessPoints = createBinding(wifi, "access-points");
	subscriptions.push(accessPoints);



	wifi.scan();
	const access_points = accessPoints((p) => p);
	const buttons = [];
	const seenSSIDs = new Map();


	for (let i = 0; i < access_points().length; ++i) {
		const access = access_points()[i];
		if (seenSSIDs.has(access.get_ssid())) continue;
		buttons.push(
			<button class="node-background" onClicked={() => access.activate(null, null)} >
				<box orientation={Gtk.Orientation.HORIZONTAL}>
					<image icon-name={access.get_icon_name()} />
					<label label={access.get_ssid()} />

				</box>
			</button >

		)
		seenSSIDs.set(access.get_ssid(), true);
	}
	return <box orientation={Gtk.Orientation.VERTICAL}>
		{buttons}
	</box>
}


function NetAudioBluetooth({ subscriptions }: { subscriptions: any[] }) {
	const network = AstalNetwork.get_default();
	const primary = createBinding(network, "primary")

	const audio = AstalWp.get_default();
	const audioSpeaker = createBinding(audio, "default-speaker");
	subscriptions.push(primary, audioSpeaker);


	const networkAlign = Gtk.Align.LEFT;
	const audioAlign = Gtk.Align.CENTER;
	let connectionIcon = primary(
		(prim) => {
			switch (prim) {
				case 1:
					return "network-wired";
				case 2:
					return "network-wireless"
			}
		}
	);
	let audioIcon = audioSpeaker(
		(speaker) => {
			return speaker.get_volume_icon();
		}
	);

	let networkContent = <box halign={networkAlign}>
		<menubutton class="node-background">
			<image icon-name={connectionIcon} />
			<popover>
				<NetworkDropdown subscriptions={subscriptions} />
			</popover>
		</menubutton>
	</box>

	let audioContent = <box halign={audioAlign}>
		<menubutton class="node-background">
			<image icon-name={audioIcon} />
		</menubutton>
	</box>



	return <box $type="end" halign={Gtk.Align.RIGHT}>
		{networkContent}
		{audioContent}
	</box>

}





export default function Bar(gdkmonitor: Gdk.Monitor) {
	const subscriptions: any[] = []

	const { TOP, LEFT, RIGHT } = Astal.WindowAnchor
	const windowRef = Variable()

	const bar = (
		<window
			ref={windowRef}
			visible
			name="bar"
			class="Bar"
			gdkmonitor={gdkmonitor}
			exclusivity={Astal.Exclusivity.EXCLUSIVE}
			anchor={TOP | LEFT | RIGHT}
			application={app}
		>
			<centerbox cssName="centerbox">
				<BatteryIndicator subscriptions={subscriptions} />
				<TimeDateCalendar subscriptions={subscriptions} />
				<NetAudioBluetooth subscriptions={subscriptions} />
			</centerbox>
		</window>
	)

	// Connect to destroy signal to clean up subscriptions
	const windowInstance = windowRef.get()
	if (windowInstance) {
		windowInstance.connect("destroy", () => {
			subscriptions.forEach(sub => sub.unsubscribe())
		})
	}

	return bar
}
