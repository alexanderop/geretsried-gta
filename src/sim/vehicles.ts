/** What each car sprite is (index = `Car.model`), named like GTA 2 names the car you get into. */
export const CAR_NAMES: ReadonlyArray<string> = ["VW Golf", "BMW 5er", "Taxi", "Audi A3", "Mercedes G", "Polizei", "VW Bus", "Post-Transporter"]

/** The green-and-white police car. */
export const POLICE_MODEL = 5

export const carName = (model: number) => CAR_NAMES[model] ?? "Auto"
