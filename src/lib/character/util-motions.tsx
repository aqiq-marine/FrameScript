import type { warn } from "console"
import { framesToSeconds } from "../audio"
import { useCurrentFrame } from "../frame"
import { Motion } from "./psd-character-component"


export type BasicPsdOptions = {
  eye: EyeOptions
  mouth: MouthOptions
}

export type EyeOptions = { kind: "enum"; options: EyeEnum } | { kind: "bool"; options: EyeBool }
export type MouthOptions = { kind: "enum"; options: MouthEnum } | { kind: "bool"; options: MouthBool }

type EyeShape = "Open" | "HalfOpen" | "HalfClosed" | "Closed"

export type EyeEnum = {
  // enum本体
  Eye: string
  Default: string
} & Record<EyeShape, string>

export type EyeBool = {
  Default: string
} & Record<EyeShape, string>

type MouthShape = "a" | "i" | "u" | "e" | "o" | "x"

export type MouthEnum = {
  Mouth: string
  Default: string
} & Record<MouthShape, string>

export type MouthBool = {
  Default: string
} & Record<MouthShape, string>

type HasKey<K extends string, V = unknown> = {
  [P in K]: V
} & Record<string, unknown>

export type LipSyncData  = HasKey<"mouthCues", {start: number, end: number, value: string}[]>

export type LipSyncProps = {
  data: LipSyncData
}

export const createLipSync = (mouthOptions: MouthOptions) => {
  return ({ data }: LipSyncProps) => {
    return <Motion motion={(_v, frames) => {
      const t = framesToSeconds(frames[0])
      let shape: MouthShape | undefined = undefined
      for (let section of data.mouthCues) {
        if (section.start <= t && t < section.end) {
          shape = lipSyncValueToMouthShape(section.value)
          break
        }
      }

      if (!shape) {
        return {}
      }


      if (mouthOptions.kind === "enum") {
        return {
          [mouthOptions.options.Mouth]: mouthOptions.options[shape]
        }
      } else if (mouthOptions.options[shape] == mouthOptions.options.Default) {
        return {
          [mouthOptions.options.Default]: true
        }
      } else {
        const opt = {
          [mouthOptions.options.Default]: false,
          [mouthOptions.options[shape]]: true
        }

        return opt
      }

    }} />
  }
}

const lipSyncValueToMouthShape = (value: string): MouthShape => {
  switch (value) {
    case "A":
      return "a"
    case "B":
      return "i"
    case "C":
      return "e"
    case "D":
      return "a"
    case "E":
      return "o"
    case "F":
      return "u"
    case "G":
      return "i"
    case "H":
      return "u"
    case "X":
      return "x"
    default:
      return "x"
  }
}

