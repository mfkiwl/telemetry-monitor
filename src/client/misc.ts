import {IIoState} from "./IGlobalState"

export function roundToPrecision(x: number, precision: number): number {
    return Math.round((x + Number.EPSILON) * precision) / precision
}

export function getCurrTime(): number {
    const t: Date = new Date()
    return t.getTime()
}

export class Stopwatch {
    t0: number
    t1: number
    dt: number

    constructor() {
        this.t0 = 0
        this.t1 = 0
        this.dt = 0
    }

    start() {
        this.t0 = getCurrTime()
    }

    stop() {
        this.t1 = getCurrTime()
        this.dt += (this.t1 - this.t0) / 1000.0
    }

    reset() {
        this.t0 = 0
        this.t1 = 0
        this.dt = 0
    }

    get duration(): number {
        return this.dt
    }
}

export class DataListener<T> {
    valInternal: T

    constructor(initVal: T) {
       this.valInternal = initVal
    }

    valListener(val: T) {}

    registerListener(listener: (val: T) => void) {
        this.valListener = listener
    }

    set value(val: T) {
      this.valInternal = val
      this.valListener(val)
    }

    get value(): T {
      return this.valInternal
    }
}

export function getFormattedTime(): string {
    const today: Date = new Date()
    const dateArr = [
        today.getFullYear(), today.getMonth() + 1, today.getDate(),
        today.getHours(), today.getMinutes(), today.getSeconds()
    ]
    return dateArr.join("-")
}

export function checkWsIsOpen(io: IIoState): boolean {
    if (io.ws instanceof WebSocket) {
        const wsIsOpen: boolean = !!((io.ws.readyState) && (io.ws.readyState === io.ws.OPEN))
        return wsIsOpen
    }
    return false
}
