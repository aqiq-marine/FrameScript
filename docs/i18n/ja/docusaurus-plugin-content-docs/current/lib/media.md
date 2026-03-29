---
title: 動画とサウンド
sidebar_position: 3
---

### `<Video>`

動画を音声とともに配置します（ミュート可能）。
Studio では `<video>`、レンダー時は WebSocket + Canvas で再生します。

```tsx
import { Video } from "../src/lib/video/video"

<Video video="assets/demo.mp4" />
```

`trim` でソースの切り出しも可能です（フレーム単位）。

```tsx
<Video video="assets/demo.mp4" trim={{ from: 30, duration: 120 }} />
```

タイムラインの波形表示は60秒未満のクリップは自動で有効です。
長いクリップは `showWaveform` を指定した場合のみ表示されます。

```tsx
<Video video="assets/demo.mp4" showWaveform />
```

### `<Img>`

レンダラーがフレームを取得する前にデコード完了を待つ画像コンポーネントです。

```tsx
import { Img } from "../src/lib/image"

<Img src="assets/intro.png" />
```

### `video_length`
動画の長さを取得します。
```tsx
const length = video_length({ path: "assets/demo.mp4" })
```

### `<Sound>`

Studio で音声を再生しつつ、レンダリング後にも該当箇所に音をつけます。

```tsx
import { Sound } from "../src/lib/sound/sound"

<Sound sound="assets/music.mp3" trim={{ trimStart: 30 }} />
```

タイムラインの波形表示は60秒未満のクリップは自動で有効です。
長いクリップは `showWaveform` を指定した場合のみ表示されます。

```tsx
<Sound sound="assets/music.mp3" showWaveform />
```

### `<Character>`

音量に応じて口の閉じた/開いた画像を切り替えます。
`clipLabel` を指定すると、そのラベルのクリップ内の音声にのみ反応します。

```tsx
import { Character } from "../src/lib/sound/character"

<Clip label="Voice">
  <Sound sound="assets/voice.mp3" />
</Clip>

<Character
  mouthClosed="assets/char_closed.png"
  mouthOpen="assets/char_open.png"
  threshold={0.12}
  clipLabel="Voice"
/>
```

### `<PsdCharacter>`

PSDファイルを利用した、口パクなどのアニメーションを制御します。
`<PsdCharacter>`コンポーネント内で、専用のコンポーネントを利用してPSDのオプションを制御し、canvasへ描画します。
コンポーネントを作成することもできますが、内部でフックを使うことは出来ません。

```tsx
import { BEZIER_SMOOTH } from "../src/lib/animation/functions"
import { seconds } from "../src/lib/frame"
import { PsdCharacter, MotionSequence, MotionWithVars, createSimpleLipSync } from "../src/lib/character/character-unit"


const SimpleLipSync = createSimpleLipSync({
  kind: "bool",
  options: {
    Default: "表情/口/1",
    Open: "表情/口/1",
    Closed: "表情/口/5",
  }
})

<PsdCharacter psd="../assets/char.psd" className="char">
  <MotionSequence>
    <SimpleLipSync voice="../assets/001_char.wav" />
    <MotionWithVars
      variables={{t: 0 as number}}
      animation={async (ctx, variables) => {
        await ctx.move(variables.t).to(1, seconds(1), BEZIER_SMOOTH)

      }}
      motion={(variables, frames) => {
        const t = variables.time.get(frames[0])
        if (t > 0.5) {
          return {
            "表情/目/9": false,
            "表情/目/17": true
          }
        } else {
            return {}
        }
      }}
    />

  </MotionSequence>
</PsdCharacter>
```

主なコンポーネントは次の通りです。

#### `<MotionSequence>`

子要素を直列化します。
内部的には`<Sequence>`を利用しており、子要素は`<Clip>`で囲われます。

```tsx
import { MotionSequence, createSimpleLipSync } from "../src/lib/character/character-unit"

const SimpleLipSync = createSimpleLipSync({
  kind: "bool",
  options: {
    Default: "表情/口/1",
    Open: "表情/口/1",
    Closed: "表情/口/5",
  }
})

<MotionSequence>
  <SimpleLipSync voice="../assets/001_char.wav" />
  <SimpleLipSync voice="../assets/002_char.wav" />
</MotionSequence>
```

#### MotionClip

MotionSequence直下で使用して、子要素を並列化します。

```tsx
import { MotionSequence, MotionClip, createSimpleLipSync } from "../src/lib/character/character-unit"

const SimpleLipSync = createSimpleLipSync({
  kind: "bool",
  options: {
    Default: "表情/口/1",
    Open: "表情/口/1",
    Closed: "表情/口/5",
  }
})

<MotionSequence>
  <SimpleLipSync voice="../assets/001_char.wav" />
  <MotionClip>
    <SimpleLipSync voice="../assets/002_char.wav" />
    <SimpleLipSync voice="../assets/003_char.wav" />
  </MotionClip>
</MotionSequence>
```

#### Voice

音声を配置します。
内部的には音声はClipで囲われます。

```tsx
import { Voice } from "../src/lib/character/character-unit"

<Voice voice="../assets/001_char.wav" />
```

#### MotionWithVars

変数を使用したアニメーションを作成します。
`variables`で変数を宣言し、次に`animation`でアニメーションを宣言し、最後に`motion`でPSDのオプションを返します。
オプションはag-psd-psdtoolの`renderPsd`の引数`data`に準拠します。

`PsdCharacter`以下ではフックが使えないため、`Variable`の値は`frames[0]`を利用して、`get`メソッドから得てください。

`frames[0]`には`useCurrentFrame`で得られるフレーム数が入っていますが、`MotionWithVars`自体は`<Clip>`で囲われないことに注意してください。

```tsx
import { BEZIER_SMOOTH } from "../src/lib/animation/functions"
import { seconds } from "../src/lib/frame"
import { MotionWithVars } from "../src/lib/character/character-unit"

<MotionWithVars
  variables={{t: 0 as number}}
  animation={async (ctx, variables) => {
    await ctx.move(variables.t).to(1, seconds(1), BEZIER_SMOOTH)

  }}
  motion={(variables, frames) => {
    const t = variables.time.get(frames[0])
    if (t > 0.5) {
      return {
        "表情/目/9": false,
        "表情/目/17": true
      }
    } else {
        return {}
    }
  }}
/>
```

#### `createSimpleLipSync`

PSDファイルに対応した音量ベースの口パクを行うコンポーネントを返す関数です。
##### psd-tool-kitに対応している場合
`Mouth`にはPSDの口のレイヤーを指定します。
`Default`にはPSDファイルがデフォルトで表示する口のオプションを指定します。
`Open`, `Closed`にはそれぞれ対応するオプションを指定します。

##### psd-tool-kitに対応していない場合
`Default`にはPSDファイルがデフォルトで表示する口のレイヤーを指定します。
`Open`, `Closed`にはそれぞれ対応するレイヤーを指定します。

```tsx
import { createSimpleLipSync } from "../src/lib/character/character-unit"

const SimpleLipSync = createSimpleLipSync({
  kind: "bool",
  options: {
    Default: "表情/口/1",
    Open: "表情/口/1",
    Closed: "表情/口/5",
  }
})

<SimpleLipSync voice="../assets/001_char.wav" />
```

