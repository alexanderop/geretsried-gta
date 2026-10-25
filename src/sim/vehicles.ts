import { CAR_LENGTH } from "./car.ts"

/** What each car sprite is (index = `Car.model`), named like GTA 2 names the car you get into. 8 is the regional bus, which has its own long sprite. */
export const CAR_NAMES: ReadonlyArray<string> = ["VW Golf", "BMW 5er", "Taxi", "Audi A3", "Mercedes G", "Polizei", "VW Bus", "Post-Transporter", "Linienbus"]

/** The green-and-white police car. */
export const POLICE_MODEL = 5

/** The MVV / RVO regional bus: 12 m long, drives its line (traffic.ts), can be ridden but not driven. */
export const BUS_MODEL = 8
export const BUS_LENGTH = 12

export const carName = (model: number) => CAR_NAMES[model] ?? "Auto"

/** Bumper to bumper, meters. */
export const vehicleLength = (model: number) => (model === BUS_MODEL ? BUS_LENGTH : CAR_LENGTH)
