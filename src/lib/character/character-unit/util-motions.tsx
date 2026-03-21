import { framesToSeconds } from "../../audio"
import { useCurrentFrame } from "../../frame"
import { Motion } from "./psd-character-component"


export type BasicPsdOptions = {
  eye: EyeOptions
  mouth: MouthOptions
}

export type EyeOptions = { kind: "enum"; options: EyeEnum } | { kind: "bool"; options: EyeBool }
export type MouthOptions = { kind: "enum"; options: MouthEnum } | { kind: "bool"; options: MouthBool }

type EyeShape = "Open" | "HalfOpen" | "HalfClosed" | "Closed"

/**
 * 目パチに関するag-psd-psdtoolに渡す名前を登録する
 * @property Eye 目の階層までのパス
 * @property Default デフォルトのオプション
 */
export type EyeEnum = {
  Eye: string
  Default: string
} & Record<EyeShape, string>

/**
 * 目パチに関するag-psd-psdtoolに渡す名前を登録する
 * Enumになっていないpsdをそのまま利用する用
 * @property Default デフォルトのオプション
 */
export type EyeBool = {
  Default: string
} & Record<EyeShape, string>

type MouthShape = "A" | "I" | "U" | "E" | "O" | "X"

/**
 * あいうえお口パクに関するag-psd-psdtoolに渡す名前を登録する
 * @property Mouth 口の階層までのパス
 * @property Default デフォルトのオプション
 * @property X 無声時の口を閉じる形のオプション
 */
export type MouthEnum = {
  Mouth: string
  Default: string
} & Record<MouthShape, string>

/**
 * あいうえお口パクに関するag-psd-psdtoolに渡す名前を登録する
 * enumになっていないものをそのまま利用する用
 * @property Default デフォルトのオプション
 * @property X 無声時の口を閉じる形のオプション
 */
export type MouthBool = {
  Default: string
} & Record<MouthShape, string>

type HasKey<K extends string, V = unknown> = {
  [P in K]: V
} & Record<string, unknown>


// lip sync --------------------------------

export type LipSyncData  = HasKey<"mouthCues", {start: number, end: number, value: string}[]>

export type LipSyncProps = {
  data: LipSyncData
}

/**
 * Psdに対応した口パク用のコンポーネントを返す。
 * @example
 * const LipSync = createLipSync({
 *   kind: "enum" as const,
 *   options: {
 *     Mouth: "目・口/口", 
 *     Default: "あ",
 *     A: "あ", 
 *     I: "い", 
 *     U: "う", 
 *     E: "え", 
 *     O: "お", 
 *     X: "閉じ", 
 *   }
 * })
 *
 * const data = {
 *   mouthCues: [{start: 0}, {end: 1}, {value: "A"}]
 * }
 * 
 * // 略 --------------------
 *
 * <PsdCharacter psd={psd}>
 *   <Voice voice={voice}/>
 *   <LipSync data={data}/>
 * </PsdCharacter>
 */
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
      return "A"
    case "B":
      return "I"
    case "C":
      return "E"
    case "D":
      return "A"
    case "E":
      return "O"
    case "F":
      return "U"
    case "G":
      return "I"
    case "H":
      return "U"
    case "X":
      return "X"
    default:
      return "X"
  }
}

// blink --------------------------------

export type BlinkData = HasKey<"blinkCues", {start: number, end: number, value: string}[]>

export type BlinkProps = {
  data: BlinkData
}

/**
 * Psdに対応した目パチ用のコンポーネントを返す。
 * @example
 * const Blink = createBlink({
 *   kind: "enum" as const,
 *   options: {
 *     Eye: "目・口/目", 
 *     Default: "デフォルト"
 *     Open: "デフォルト",
 *     HalfOpen: "やや閉じ",
 *     HalfClosed: "半目",
 *     Closed: "閉じ"
 *   }
 * })
 *
 * const data = {
 *   blinkCues: [
 *     { start: 0.00, end: 0.40, value: "A" },
 *     { start: 0.40, end: 0.45, value: "B" },
 *     { start: 0.45, end: 0.50, value: "C" },
 *     { start: 0.50, end: 0.55, value: "D" },
 *     { start: 0.55, end: 0.60, value: "C" },
 *     { start: 0.60, end: 0.65, value: "B" },
 *     { start: 0.65, end: 6.65, value: "A" }
 *   ]
 * }
 * 
 * // 略 --------------------
 *
 * <PsdCharacter psd={psd}>
 *   <Voice voice={voice}/>
 *   <Blink data={data}/>
 * </PsdCharacter>
 */
export const createBlink = (eyeOptions: EyeOptions) => {
  return ({ data }: BlinkProps) => {
    return <Motion motion={(_v, frames) => {

      const t = framesToSeconds(frames[1])
      const sections = data.blinkCues
      
      let lo = 0
      let hi = sections.length - 1
      let idx = -1
      
      while (lo <= hi) {
        const mid = (lo + hi) >> 1
      
        if (sections[mid].start <= t) {
          idx = mid
          lo = mid + 1
        } else {
          hi = mid - 1
        }
      }
      
      let shape: EyeShape | undefined = undefined
      if (idx !== -1 && t < sections[idx].end) {
        shape = BlinkValueToEyeShape(sections[idx].value)
      }

      if (!shape) {
        return {}
      }


      if (eyeOptions.kind === "enum") {
        return {
          [eyeOptions.options.Eye]: eyeOptions.options[shape]
        }
      } else if (eyeOptions.options[shape] == eyeOptions.options.Default) {
        return {
          [eyeOptions.options.Default]: true
        }
      } else {
        const opt = {
          [eyeOptions.options.Default]: false,
          [eyeOptions.options[shape]]: true
        }

        return opt
      }

    }} />
  }
}

const BlinkValueToEyeShape = (value: string): EyeShape => {
  switch (value) {
    case "A":
      return "Open"
    case "B":
      return "HalfOpen"
    case "C":
      return "HalfClosed"
    case "D":
      return "Closed"
    default:
      return "Open"
  }
}
