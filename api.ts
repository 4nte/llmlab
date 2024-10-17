const lightState = new Map<string, boolean>()
lightState.set("garage", false)
lightState.set("living room", false)
lightState.set("bedroom", false)

export function setLight(location: string, active: boolean) {
	console.log('Light API called...')
	console.log('Control the light relay ')

	lightState.set(location, active)

	// basement lights are broken
	if (location === "basement") {
		throw Error("basement lights are broken")
	}

	return true
}


const temperatureState = new Map<string, number>()
temperatureState.set("garage", 12)
temperatureState.set("living room", 20)
temperatureState.set("bedroom", 23)

export async function getTemperature(location: string): Promise<string> {
	const temperature = temperatureState.get(location)
	if (temperature === undefined) {
		throw Error("could not get temperature")
	}

	return temperature.toString()
}


let isGarageOpen = false
export function controlGarageDoors(open: boolean) {
	isGarageOpen = open
}

export function getGarageState() {
	return isGarageOpen
}
